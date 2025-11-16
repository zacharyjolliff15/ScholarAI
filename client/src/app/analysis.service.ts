// src/app/analysis.service.ts

import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, catchError, tap, EMPTY } from 'rxjs';

// --- Type Definitions for Glossary ---
export interface GlossaryTerm {
  term: string;
  definition: string;
}
export interface GlossaryResponse {
  terms: GlossaryTerm[];
}

// --- Type Definitions for Learning Plan ---
export interface LearningStep {
  title: string;
  description: string;
  stepNumber: number;
  expectedTime: string; // e.g., "30 minutes"
}
export interface LearningPlanResponse {
  planTitle: string;
  steps: LearningStep[];
}

interface ApiError {
    error?: { error?: string };
    message?: string;
}


@Injectable({
  providedIn: 'root'
})
export class AnalysisService {
  // --- Glossary State ---
  glossary = signal<GlossaryTerm[]>([]);
  glossaryLoading = signal(false);
  glossaryError = signal<string>('');
  
  // --- Learning Plan State ---
  learningPlan = signal<LearningPlanResponse | null>(null);
  planLoading = signal(false);
  planError = signal<string>('');
  
  selectedDocId = signal<string | null>(null);

  constructor(private api: ApiService) { }

  // ------------------------------------
  // Glossary Generation Logic
  // ------------------------------------
  generateGlossary(docId: string): Observable<GlossaryResponse> {
    this.glossaryError.set('');
    this.glossaryLoading.set(true);
    this.glossary.set([]);
    this.selectedDocId.set(docId);

    // Assume ApiService has a new method 'generateGlossary'
    return this.api.generateGlossary(docId).pipe(
      tap((res: GlossaryResponse) => {
        this.glossary.set(res.terms || []);
        this.glossaryLoading.set(false);
      }),
      catchError((err: ApiError) => {
        console.error(err);
        this.glossaryError.set('Failed to generate glossary.');
        this.glossaryLoading.set(false);
        return EMPTY;
      })
    );
  }

  // ------------------------------------
  // Learning Plan Generation Logic
  // ------------------------------------
  generateLearningPlan(docId: string): Observable<LearningPlanResponse> {
    this.planError.set('');
    this.planLoading.set(true);
    this.learningPlan.set(null);
    this.selectedDocId.set(docId);

    // Assume ApiService has a new method 'generateLearningPlan'
    return this.api.generateLearningPlan(docId).pipe(
      tap((res: LearningPlanResponse) => {
        this.learningPlan.set(res);
        this.planLoading.set(false);
      }),
      catchError((err: ApiError) => {
        console.error(err);
        this.planError.set('Failed to generate learning plan.');
        this.planLoading.set(false);
        return EMPTY;
      })
    );
  }

  clearAll() {
    this.glossary.set([]);
    this.learningPlan.set(null);
    this.glossaryError.set('');
    this.planError.set('');
    this.selectedDocId.set(null);
  }
}