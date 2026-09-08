import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage)
  },
  {
    path: 'birthday',
    loadComponent: () => import('./features/birthday/birthday.page').then((m) => m.BirthdayPage)
  },
  {
    path: 'timeline',
    loadComponent: () => import('./features/timeline/timeline.page').then((m) => m.TimelinePage)
  },
  {
    path: 'memory/:id',
    loadComponent: () => import('./features/memory-detail/memory-detail.page').then((m) => m.MemoryDetailPage)
  },
  {
    path: 'japan-notes',
    loadComponent: () => import('./features/japan-notes/japan-notes.page').then((m) => m.JapanNotesPage)
  },
  {
    path: 'love-treasure',
    loadComponent: () => import('./features/love-treasure/love-treasure.page').then((m) => m.LoveTreasurePage)
  },
  {
    path: 'unsaid',
    loadComponent: () => import('./features/unsaid/unsaid.page').then((m) => m.UnsaidPage)
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage)
  }
];
