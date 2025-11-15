import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type DocMeta = { id: string; name: string; chunkCount: number; createdAt: string };

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}
  private readonly base = 'http://localhost:8787/api';

  health() {
    return this.http.get<{ ok: boolean }>(`${this.base}/health`);
  }

  listDocs() {
    return this.http.get<{ docs: DocMeta[] }>(`${this.base}/docs`);
  }

  upload(files: File[]) {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return this.http.post<{ uploaded: any[] }>(`${this.base}/upload`, form);
  }

  ask(question: string, docIds: string[], k = 6) {
    return this.http.post<{ answer: string; citations: any[] }>(
      `${this.base}/ask`,
      { question, docIds, k }
    );
  }

  getDocs() {
    return this.http.get<{ docs: any[] }>(`${this.base}/docs`);
  }

  summarize(docId: string) {
    return this.http.post<{ summary: string }>(`${this.base}/summarize`, { docId });
  }

  generateFlashcards(docId: string, count = 3) {
    return this.http.post<{ flashcards: { question: string; answer: string }[] }>(
      `${this.base}/flashcards`,
      { docId, count }
    );
  }

  generateQuiz(docId: string) {
    return this.http.post<{ questions: QuizQuestion[] }>(
      `${this.base}/quiz`,
      { docId }
    );
  }
}