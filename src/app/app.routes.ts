import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { permisosGuard, adminGuard } from './core/guards/permisos.guard';
import { acudienteGuard, staffGuard } from './core/guards/acudiente.guard';

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
        canActivate: [staffGuard],
        loadComponent: () => import('./features/auth/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'jugadores',
        loadComponent: () => import('./features/jugadores/jugadores.component').then(m => m.JugadoresComponent),
        canActivate: [permisosGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { modulo: 'jugadores' }
      },
      {
        path: 'categorias',
        loadComponent: () => import('./features/categorias/categorias.component').then(m => m.CategoriasComponent),
        canActivate: [permisosGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { modulo: 'categorias' }
      },
      {
        path: 'pagos',
        loadComponent: () => import('./features/pagos/pagos.component').then(m => m.PagosComponent),
        canActivate: [permisosGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { modulo: 'pagos' }
      },
      {
        path: 'mensualidades',
        loadComponent: () => import('./features/mensualidades/mensualidades.component').then(m => m.MensualidadesComponent),
        canActivate: [permisosGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { modulo: 'mensualidades' }
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/reportes/reportes.component').then(m => m.ReportesComponent),
        canActivate: [permisosGuard],
        data: { modulo: 'reportes' }
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'ayuda',
        loadComponent: () => import('./features/ayuda/ayuda.component').then(m => m.AyudaComponent)
      },
      {
        path: 'portal',
        canActivate: [acudienteGuard],
        children: [
          {
            path: 'mis-hijos',
            loadComponent: () => import('./features/portal/mis-hijos.component').then(m => m.MisHijosComponent)
          },
          {
            path: 'hijos/:jugadorId',
            loadComponent: () => import('./features/portal/hijo-detalle.component').then(m => m.HijoDetalleComponent)
          },
          {
            path: '',
            redirectTo: 'mis-hijos',
            pathMatch: 'full'
          }
        ]
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
