// src/app/main-page/main-page.component.ts

import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, DocMeta } from '../api.service'; 
import { AnalysisService, GlossaryTerm, LearningPlanResponse } from '../analysis.service';


// --- Interface Definitions for Type Safety ---

type Msg = { role: 'user' | 'assistant'; content: string; citations?: any[] };

type QuizQuestion = {
	question: string;
	options: string[];
	correctIndex: number;
	selectedIndex?: number;
	answered?: boolean;
};

type Flashcard = {	
	question: string;	
	answer: string;	
	show?: boolean;	
};

// Response Interfaces
interface ListDocsResponse {
	docs: DocMeta[];
}
interface AskResponse {
	answer: string;
	citations: any[];
}
interface SummarizeResponse {
	summary: string;
}
interface FlashcardsResponse {
	flashcards: Flashcard[];
}
interface QuizResponse {
	questions: QuizQuestion[];
}

// Records Interface
interface QuizAnswerRecord {
  	question: string;
	options: string[];
	correctIndex: number;
	selectedIndex: number | null;
	wasCorrect: boolean;
}

type QuizSource = 'doc' | 'chat';

interface QuizAttempt {
	timestamp: string;       
	score: number;
	total: number;
	percentage: number;
	source: QuizSource;
	answers: QuizAnswerRecord[];
}


// Error Interface
interface ApiError {
	error?: { error?: string };
	message?: string;
}

@Component({
	selector: 'app-main-page', // CHANGED from 'app-root'
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: '../app.component.html',	
	styleUrls: ['../app.component.scss']
})
export class MainPageComponent { // CHANGED from AppComponent
	title = 'ScholarAI';
	docs = signal<DocMeta[]>([]);
	selected = signal<Set<string>>(new Set());
	uploading = signal(false);
	question = signal('');
	k = signal(6);
	chat = signal<Msg[]>([]);
	summary = signal<string>('');
	error = signal<string>('');
	
	// ---- Flashcards ----
	flashcards = signal<Flashcard[]>([]); // Used Flashcard type
	selectedFlashcardDocId = signal<string | null>(null);
	flashcardCount = signal(3);
	flashcardError = signal<string>('');
	isLoadingFlashcards = signal(false);

	// ---- Quiz ----
	quizQuestions = signal<QuizQuestion[]>([]);
	selectedQuizDocId = signal<string | null>(null);
	quizError = signal<string>('');
	isLoadingQuiz = signal(false);
	quizSubmitted = signal(false);

	// ---- New state for Analysis/Study tools (from HTML) ----
	selectedGlossaryDocId = signal<string | null>(null);
	selectedPlanDocId = signal<string | null>(null);

	// Proxies to analysis service state signals
	glossary = signal<GlossaryTerm[]>([]);
	isLoadingGlossary = signal(false);
	glossaryError = signal<string>('');
	learningPlan = signal<LearningPlanResponse | null>(null);
	isLoadingPlan = signal(false);
	planError = signal<string>('');

	// track where the current quiz came from
	currentQuizSource = signal<QuizSource>('doc');

	// all past attempts in this session
	quizHistory = signal<QuizAttempt[]>([]);

	// derived stats
	averageScore = computed(() => {
		const history = this.quizHistory();
		if (!history.length) return 0;
		const totalPoints = history.reduce((sum, a) => sum + a.score, 0);
		const totalMax = history.reduce((sum, a) => sum + a.total, 0);
		return totalMax === 0 ? 0 : Math.round((totalPoints / totalMax) * 100);
	});

	bestScore = computed(() => {
		const history = this.quizHistory();
		if (!history.length) return 0;
		return history.reduce(
			(best, a) => Math.max(best, Math.round((a.score / a.total) * 100)),
			0
		);
	});


	constructor(
		private api: ApiService,
		public analysisService: AnalysisService,
		private router: Router
	) {
		// Initialize the proxies to the analysis service signals here (Fixing TS2729)
		this.glossary = this.analysisService.glossary;
		this.isLoadingGlossary = this.analysisService.glossaryLoading;
		this.glossaryError = this.analysisService.glossaryError;

		this.learningPlan = this.analysisService.learningPlan;
		this.isLoadingPlan = this.analysisService.planLoading;
		this.planError = this.analysisService.planError;

		this.refresh();
	}

	// --- Glossary Generation ----
	generateGlossary() {
		const docId = this.selectedGlossaryDocId();
		if (!docId) {
			this.analysisService.glossaryError.set('Please select a document first.');
			return;
		}
		
		// Call the service method
		this.analysisService.generateGlossary(docId).subscribe();	
	}

	// --- Learning Plan Generation ----
	generateLearningPlan() {
		const docId = this.selectedPlanDocId();
		if (!docId) {
			this.analysisService.planError.set('Please select a document first.');
			return;
		}

		// Call the service method
		this.analysisService.generateLearningPlan(docId).subscribe();
	}

	// Utility to clear all analysis output
	clearAnalysis() {
		this.analysisService.clearAll();
	}

	refresh() {
		this.api.listDocs().subscribe({
			next: ({ docs }: ListDocsResponse) => this.docs.set(docs),	
			error: (e: ApiError) => this.error.set(String(e?.error?.error || e.message))
		});
	}

	onPick(ev: Event) {
		const input = ev.target as HTMLInputElement;
		if (!input.files?.length) return;
		this.upload(Array.from(input.files));
		input.value = '';
	}

	onDrop(ev: DragEvent) {
		ev.preventDefault();
		const files = ev.dataTransfer?.files ? Array.from(ev.dataTransfer.files) : [];
		if (files.length) this.upload(files);
	}
	onDragOver(ev: DragEvent) { ev.preventDefault(); }

	upload(files: File[]) {
		this.uploading.set(true);
		this.api.upload(files).subscribe({
			next: () => { this.uploading.set(false); this.refresh(); },
			error: (e: ApiError) => { this.uploading.set(false); this.error.set(String(e?.error?.error || e.message)); }
		});
	}

	toggleDoc(id: string) {
		const s = new Set(this.selected());
		s.has(id) ? s.delete(id) : s.add(id);
		this.selected.set(s);
	}

	deleteDoc(id: string, name: string) {
		if (!confirm(`Are you sure you want to delete "${name}"?`)) { // Added name to confirm
			return;
		}

		this.api.deleteDoc(id).subscribe({
			next: () => {
				// Remove from selected if it was selected
				const s = new Set(this.selected());
				s.delete(id);
				this.selected.set(s);
				
				// Refresh the docs list
				this.refresh();
			},
			error: (e: ApiError) => this.error.set(String(e?.error?.error || e.message))
		});
	}

	getFileType(filename: string): 'pdf' | 'docx' | 'txt' | 'unknown' {
		const lower = filename.toLowerCase();
		if (lower.endsWith('.pdf')) return 'pdf';
		if (lower.endsWith('.docx')) return 'docx';
		if (lower.endsWith('.txt') || lower.endsWith('.md')) return 'txt';
		return 'unknown';
	}

	ask() {
		const q = this.question().trim();
		if (!q) return;
		const ids = Array.from(this.selected());
		this.chat.update(arr => [...arr, { role: 'user', content: q }]);
		this.api.ask(q, ids, this.k()).subscribe({
			next: ({ answer, citations }: AskResponse) => {
				this.chat.update(arr => [...arr, { role: 'assistant', content: answer, citations }]);
				this.question.set('');
			},
			error: (e: ApiError) => this.error.set(String(e?.error?.error || e.message))
		});
	}

	doSummarize(doc: DocMeta) {
		this.summary.set('Summarizing…');
		this.api.summarize(doc.id).subscribe({
			next: ({ summary }: SummarizeResponse) => this.summary.set(summary),
			error: (e: ApiError) => this.summary.set(String(e?.error?.error || e.message))
		});
	}

	// ---- Flashcard generation ----
	generateFlashcards() {
		this.flashcardError.set('');

		const docId = this.selectedFlashcardDocId();
		if (!docId) {
			this.flashcardError.set('Please select a document first.');
			return;
		}

		this.isLoadingFlashcards.set(true);
		this.flashcards.set([]);

		this.api.generateFlashcards(docId, this.flashcardCount())
			.subscribe({
				next: (res: FlashcardsResponse) => {
					this.flashcards.set(res.flashcards || []);
					this.isLoadingFlashcards.set(false);
				},
				error: (err: ApiError) => {
					console.error(err);
					this.flashcardError.set('Something went wrong.');
					this.isLoadingFlashcards.set(false);
				}
			});
	}

	toggleFlashcard(i: number) {
		const arr = [...this.flashcards()];
		arr[i] = {
			...arr[i],
			answer: arr[i].answer,
			show: !arr[i].show
		};
		this.flashcards.set(arr);
	}

	// export tsv file of flashcards to Anki
	exportFlashcardsToAnki() {
    const cards = this.flashcards();

    if (!cards.length) {
      this.flashcardError.set('No flashcards to export, please generate some flashcards first');
      return;
    }

    // Build TSV content: "question<TAB>answer" per line
    const lines = cards.map(fc => {
      const q = (fc.question || '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
      const a = (fc.answer || '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
      return `${q}\t${a}`;
    });

    const tsv = lines.join('\n');
    const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'scholarai-flashcards.tsv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

	// ---- Quiz generation ----
	generateQuiz() {
		this.quizError.set('');

		const docId = this.selectedQuizDocId();
		if (!docId) {
			this.quizError.set('Please select a document first.');
			return;
		}

		this.isLoadingQuiz.set(true);
		this.quizQuestions.set([]);
		this.quizSubmitted.set(false);

		this.api.generateQuiz(docId)
			.subscribe({
				next: (res: QuizResponse) => {
					this.quizQuestions.set(res.questions || []);
					this.isLoadingQuiz.set(false);
				},
				error: (err: ApiError) => {
					console.error(err);
					this.quizError.set('Something went wrong generating the quiz.');
					this.isLoadingQuiz.set(false);
				}
			});
	}

	selectQuizAnswer(questionIndex: number, optionIndex: number) {
		if (this.quizSubmitted()) return;
		
		const questions = [...this.quizQuestions()];
		questions[questionIndex] = {
			...questions[questionIndex],
			selectedIndex: optionIndex
		};
		this.quizQuestions.set(questions);
	}

	submitQuiz() {
		const questions = this.quizQuestions();
		const allAnswered = questions.every(q => q.selectedIndex !== undefined);
		
		if (!allAnswered) {
			this.quizError.set('Please answer all questions before submitting.');
			return;
		}

		const answered = questions.map(q => ({
			...q,
			answered: true
		}));
		
		this.quizQuestions.set(answered);
		this.quizSubmitted.set(true);
		this.quizError.set('');
	}

	resetQuiz() {
		this.quizQuestions.set([]);
		this.quizSubmitted.set(false);
		this.quizError.set('');
	}

	getQuizScore(): { correct: number; total: number } {
		const questions = this.quizQuestions();
		const correct = questions.filter(q => q.selectedIndex === q.correctIndex).length;
		return { correct, total: questions.length };
	}

	clear() {	
		this.chat.set([]);	
		this.summary.set('');	
	}
}