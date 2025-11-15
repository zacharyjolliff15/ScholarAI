import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// IMPORTANT: Import RouterOutlet, RouterLink, and RouterLinkActive (fix for NG8002 error)
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; 

@Component({
  selector: 'app-root',
  standalone: true,
  // Add routing modules to imports
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], 
  template: `
    <nav class="app-navbar">
      <h1>ScholarAI</h1>
      <div>
        <!-- Fixed NG8002 error by using routerLinkActive -->
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Main App</a> | 
        <a routerLink="/help" routerLinkActive="active">Help</a>
      </div>
    </nav>
    <main class="app-content">
      <!-- This is where the routed components (MainPage/HelpPage) will be displayed -->
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .app-navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      background-color: #3f51b5;
      color: white;
      box-shadow: 0 0px 4px rgba(0,0,0,0.3); /* Changed shadow for better visibility */
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .app-navbar h1 { margin: 0; font-size: 1.5em; }
    .app-navbar a {
      color: white;
      text-decoration: none;
      margin-left: 15px;
      padding: 5px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .app-navbar a:hover, .app-navbar a.active {
      background-color: #5c6bc0;
    }
    .app-content {
      padding: 20px;
    }
  `]
})
export class AppComponent {
  title = 'ScholarAI';
}