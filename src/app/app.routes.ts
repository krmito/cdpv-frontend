import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/auth/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'jugadores',
        loadComponent: () => import('./features/jugadores/jugadores.component').then(m => m.JugadoresComponent),
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'categorias',
        loadComponent: () => import('./features/categorias/categorias.component').then(m => m.CategoriasComponent),
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'pagos',
        loadComponent: () => import('./features/pagos/pagos.component').then(m => m.PagosComponent),
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'mensualidades',
        loadComponent: () => import('./features/mensualidades/mensualidades.component').then(m => m.MensualidadesComponent),
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/reportes/reportes.component').then(m => m.ReportesComponent)
      },
      {
        path: 'ayuda',
        loadComponent: () => import('./features/ayuda/ayuda.component').then(m => m.AyudaComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
