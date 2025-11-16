import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // To link back to the main page

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="help-container">
      <h1>Help and Documentation</h1>
      <p>Welcome to the help page for ScholarAI. This application allows you to interact with your documents using Large Language Models (LLMs) to accelerate your learning.</p>

      <h2>Core Features</h2>
      
      <h3>1. Document Management</h3>
      <p>Use the <strong>Upload Documents</strong> area to drag-and-drop or select your files (PDF, DOCX, TXT). Once uploaded, they will appear in the <strong>Uploaded Notes</strong> list.</p>
      <p>From this list, you can perform several actions:</p>
      <ul>
        <li><strong>Select for Chat</strong>: Check the box next to a document's name to include its content in the context for the main chat. You can select multiple documents.</li>
        <li><strong>Summarize Document</strong>: Click the summarize icon to generate a concise summary of the document. The summary will appear in its own section below the chat.</li>
        <li><strong>Delete Document</strong>: Click the trash icon to permanently remove a document from the application.</li>
      </ul>

      <h3>2. Chatting with Your Documents (RAG)</h3>
      <p>The main chat interface uses <strong>Retrieval-Augmented Generation (RAG)</strong>. Type your question, and the AI will use the content of the <strong>selected</strong> documents to provide an answer with citations.</p>
      <ul>
        <li><strong>Controlling Context (K-value)</strong>: The 'K' value determines how many relevant text chunks are retrieved from your documents to answer a question. A higher 'K' provides more context but may take longer to process.</li>
        <li><strong>Clear Chat</strong>: Use the <strong>Clear chat</strong> button in the top bar to erase the current conversation history.</li>
      </ul>

      <h2>Advanced Study Tools</h2>
      <p>ScholarAI offers several tools to help you study the content of your documents more effectively. For each tool, you must first select a single document from its dropdown menu.</p>
      
      <h3>Key Concept/Glossary Builder</h3>
      <p>This tool automatically extracts important terms and their definitions from your document. Click <strong>Build Glossary</strong> to generate a list of key concepts, which is perfect for reviewing terminology.</p>

      <h3>Learning Plan Generator</h3>
      <p>Generate a structured, step-by-step learning path to master the document's content. Click <strong>Generate Learning Plan</strong> and the AI will create a plan with topics and estimated times for each step.</p>
      
      <h3>Smart Flashcards</h3>
      <p>Select a document and specify the number of cards you want to generate. Clicking <strong>Generate Flashcards</strong> creates interactive cards with a question on the front and the answer on the back.</p>
      
      <h3>Multiple-Choice Quiz</h3>
      <p>Test your knowledge by generating a quiz from a document. After answering the questions, click <strong>Submit Quiz</strong> to see your score and review which answers were correct or incorrect.</p>

      <br>
      <a routerLink="/" class="back-link">← Back to Main Application</a>
    </div>
  `,
  styles: [`
    .help-container { padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
    h1 { color: #3f51b5; }
    h2 { margin-top: 30px; border-bottom: 2px solid #3f51b5; padding-bottom: 8px; }
    h3 { margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px; color: #4A00E0; }
    ul { margin-top: 10px; padding-left: 20px; }
    li { margin-bottom: 8px; }
    a { display: block; margin-top: 30px; color: #3f51b5; text-decoration: none; font-weight: bold; }
    a:hover { text-decoration: underline; }
  `]
})
export class HelpPageComponent { }