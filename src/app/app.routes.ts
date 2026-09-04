import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage)
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
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage)
  }
];
