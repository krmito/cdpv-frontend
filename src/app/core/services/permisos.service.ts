import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface PermisoModulo {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

const STORAGE_KEY = 'permisos';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  private api = inject(ApiService);

  _permisos = signal<Record<string, PermisoModulo> | null>(null);

  constructor() {
    this.cargarDesdeStorage();
  }

  private cargarDesdeStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this._permisos.set(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }

  cargarPermisos(): Observable<Record<string, PermisoModulo>> {
    return this.api.get<Record<string, PermisoModulo>>('permisos-roles/mis-permisos').pipe(
      tap(permisos => {
        this._permisos.set(permisos);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(permisos));
      })
    );
  }

  limpiarPermisos(): void {
    this._permisos.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  isAdmin(): boolean {
    try {
      const user = JSON.parse(localStorage.getItem('user') ?? 'null');
      return user?.rol === 'administrador';
    } catch {
      return false;
    }
  }

  canView(modulo: string): boolean {
    if (this.isAdmin()) return true;
    return this._permisos()?.[modulo]?.ver ?? false;
  }

  canCreate(modulo: string): boolean {
    if (this.isAdmin()) return true;
    return this._permisos()?.[modulo]?.crear ?? false;
  }

  canEdit(modulo: string): boolean {
    if (this.isAdmin()) return true;
    return this._permisos()?.[modulo]?.editar ?? false;
  }

  canDelete(modulo: string): boolean {
    if (this.isAdmin()) return true;
    return this._permisos()?.[modulo]?.eliminar ?? false;
  }
}
