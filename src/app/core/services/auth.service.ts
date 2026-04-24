import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { PermisosService } from './permisos.service';

interface LoginRequest {
  usuario: string;
  password: string;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  usuario: string;
  rol: string;
  activo: boolean;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private storage = inject(StorageService);
  private router = inject(Router);
  private permisosService = inject(PermisosService);

  currentUser = signal<Usuario | null>(null);
  isAuthenticated = signal(false);

  constructor() {
    this.loadCurrentUser();
  }

  login(credentials: LoginRequest): Observable<Record<string, any>> {
    return this.api.post<LoginResponse>('auth/login', credentials).pipe(
      tap(response => {
        this.storage.setItem('token', response.access_token);
        this.storage.setItem('user', response.usuario);
        this.currentUser.set(response.usuario);
        this.isAuthenticated.set(true);
      }),
      switchMap(() => this.permisosService.cargarPermisos())
    );
  }

  logout(): void {
    const userName = this.currentUser()?.nombre || '';
    this.permisosService.limpiarPermisos();
    this.storage.clear();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login'], { queryParams: { logout: 'success', name: userName } });
  }

  getToken(): string | null {
    return this.storage.getItem<string>('token');
  }

  private loadCurrentUser(): void {
    const token = this.getToken();
    const user = this.storage.getItem<Usuario>('user');
    if (token && user) {
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
    }
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.api.patch<{ message: string }>('auth/change-password', { currentPassword, newPassword });
  }

  getPasswordStatus() {
    return this.api.get<{ expirado: boolean; dias_restantes: number }>('auth/password-status');
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  hasRole(roles: string[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.rol) : false;
  }
}
