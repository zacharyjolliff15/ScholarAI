import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, DocMeta } from './api.service';

type Msg = { role: 'user' | 'assistant'; content: string; citations?: any[] };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
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
flashcards = signal<{ question: string; answer: string; show?: boolean }[]>([]);
selectedFlashcardDocId = signal<string | null>(null);
flashcardCount = signal(10);
flashcardError = signal<string>('');
isLoadingFlashcards = signal(false);


  constructor(private api: ApiService) {
    this.refresh();
  }

  refresh() {
    this.api.listDocs().subscribe({
      next: ({ docs }) => this.docs.set(docs),
      error: e => this.error.set(String(e?.error?.error || e.message))
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
      error: e => { this.uploading.set(false); this.error.set(String(e?.error?.error || e.message)); }
    });
  }

  toggleDoc(id: string) {
    const s = new Set(this.selected());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selected.set(s);
  }

  ask() {
    const q = this.question().trim();
    if (!q) return;
    const ids = Array.from(this.selected());
    this.chat.update(arr => [...arr, { role: 'user', content: q }]);
    this.api.ask(q, ids, this.k()).subscribe({
      next: ({ answer, citations }) => {
        this.chat.update(arr => [...arr, { role: 'assistant', content: answer, citations }]);
        this.question.set('');
      },
      error: e => this.error.set(String(e?.error?.error || e.message))
    });
  }

  doSummarize(doc: DocMeta) {
    this.summary.set('Summarizing…');
    this.api.summarize(doc.id).subscribe({
      next: ({ summary }) => this.summary.set(summary),
      error: e => this.summary.set(String(e?.error?.error || e.message))
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
      next: (res) => {
        this.flashcards.set(res.flashcards || []);
        this.isLoadingFlashcards.set(false);
      },
      error: (err) => {
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
    answer: arr[i].answer, // keep data untouched
    show: !arr[i].show
  };
  this.flashcards.set(arr);
}

  clear() { this.chat.set([]); this.summary.set(''); }
}
