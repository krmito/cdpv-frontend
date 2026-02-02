import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

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

  currentUser = signal<Usuario | null>(null);
  isAuthenticated = signal(false);

  constructor() {
    this.loadCurrentUser();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('auth/login', credentials).pipe(
      tap(response => {
        this.storage.setItem('token', response.access_token);
        this.storage.setItem('user', response.usuario);
        this.currentUser.set(response.usuario);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout(): void {
    const userName = this.currentUser()?.nombre || '';
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

  hasRole(roles: string[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.rol) : false;
  }
}
