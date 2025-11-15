// src/app/main-page/main-page.component.ts

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// FIXED TS2307: Corrected relative path to api.service
import { ApiService, DocMeta } from '../api.service'; 

// --- Interface Definitions for Type Safety (Fixing TS7006/TS7031) ---

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

// Error Interface
interface ApiError {
    error?: { error?: string };
    message?: string;
}

@Component({
  selector: 'app-main-page', // CHANGED from 'app-root'
  standalone: true,
  imports: [CommonModule, FormsModule],
  // FIXED TS-992008: Corrected relative path to HTML/SCSS
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

  constructor(private api: ApiService) {
    this.refresh();
  }

  refresh() {
    this.api.listDocs().subscribe({
      // FIXED TS7031: Explicitly typed response destructuring
      next: ({ docs }: ListDocsResponse) => this.docs.set(docs), 
      // FIXED TS7006: Explicitly typed error parameter
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
      // FIXED TS7006: Explicitly typed error parameter
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
      // FIXED TS7006: Explicitly typed error parameter
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
      // FIXED TS7031: Explicitly typed response destructuring
      next: ({ answer, citations }: AskResponse) => {
        this.chat.update(arr => [...arr, { role: 'assistant', content: answer, citations }]);
        this.question.set('');
      },
      // FIXED TS7006: Explicitly typed error parameter
      error: (e: ApiError) => this.error.set(String(e?.error?.error || e.message))
    });
  }

  doSummarize(doc: DocMeta) {
    this.summary.set('Summarizing…');
    this.api.summarize(doc.id).subscribe({
      // FIXED TS7031: Explicitly typed response destructuring
      next: ({ summary }: SummarizeResponse) => this.summary.set(summary),
      // FIXED TS7006: Explicitly typed error parameter
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
        // FIXED TS7006: Explicitly typed response parameter
        next: (res: FlashcardsResponse) => {
          this.flashcards.set(res.flashcards || []);
          this.isLoadingFlashcards.set(false);
        },
        // FIXED TS7006: Explicitly typed error parameter
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
        // FIXED TS7006: Explicitly typed response parameter
        next: (res: QuizResponse) => {
          this.quizQuestions.set(res.questions || []);
          this.isLoadingQuiz.set(false);
        },
        // FIXED TS7006: Explicitly typed error parameter
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