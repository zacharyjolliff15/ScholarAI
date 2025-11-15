// src/app/help-page/help-page.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // To link back to the main page

@Component({
  selector: 'app-help-page',
  standalone: true,
  // Add RouterLink to imports
  imports: [CommonModule, RouterLink], 
  template: `
    <div class="help-container">
      <h1>Help and Documentation</h1>
      <p>Welcome to the help page for ScholarAI. This application allows you to interact with your documents using Large Language Models (LLMs).</p>
      
      <h2>How to Use</h2>
      <h3>1. Document Management</h3>
      <!-- Changed **Upload Documents** to <strong>Upload Documents</strong> -->
      <p>Use the <strong>Upload Documents</strong> area to drag-and-drop or select files (PDF, DOCX, TXT) to upload them to the system. Select documents to include them in the context for the chat.</p>
      
      <h3>2. Chat (RAG)</h3>
      <!-- Changed **Retrieval-Augmented Generation (RAG)** and **selected** to <strong> tags -->
      <p>The main chat interface uses <strong>Retrieval-Augmented Generation (RAG)</strong>. Type your question, and the AI will use the content of the <strong>selected</strong> documents to provide an answer with citations.</p>
      
      <h3>3. Study Tools</h3>
      <!-- Changed **Flashcards** and **Multiple-Choice Quiz** to <strong> tags -->
      <p>Select a single document from the dropdown in the respective sections to generate <strong>Flashcards</strong> or a <strong>Multiple-Choice Quiz</strong> based on the document's content.</p>

      <br>
      <a routerLink="/" class="back-link">← Back to Main Application</a>
    </div>
  `,
  styles: [`
    .help-container { padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
    h1 { color: #3f51b5; }
    h2 { margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    a { display: block; margin-top: 30px; color: #3f51b5; text-decoration: none; }
    a:hover { text-decoration: underline; }
  `]
})
export class HelpPageComponent { }