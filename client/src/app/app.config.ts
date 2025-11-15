import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router'; // Added Routes
import { provideHttpClient, withFetch } from '@angular/common/http';

// Import new components
import { MainPageComponent } from './main-page/main-page.component';
import { HelpPageComponent } from './help-page/help-page.component';

// Define the application routes
const routes: Routes = [
  { path: '', component: MainPageComponent },       // Main content at the root path
  { path: 'help', component: HelpPageComponent },   // New help page
  { path: '**', redirectTo: '' }                   // Redirect any unknown path back to the main page
];

export const appConfig: ApplicationConfig = {
  providers: [
    // Provide the router with the defined routes
    provideRouter(routes), 
    provideHttpClient(withFetch())
  ]
};