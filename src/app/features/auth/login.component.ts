import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>⚽ Club Deportivo</h1>
        <h2>Sistema de Gestión</h2>

        @if (errorMessage) {
          <div class="alert alert-danger">{{ errorMessage }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Usuario</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="credentials.usuario"
              name="usuario"
              required
              placeholder="admin"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              class="form-control"
              [(ngModel)]="credentials.password"
              name="password"
              required
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <div class="login-info">
          <p><strong>Usuarios de prueba:</strong></p>
          <p>👤 admin / Admin123!</p>
          <p>👤 tesorero / Admin123!</p>
          <p>👤 consulta / Admin123!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .login-card {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 400px;
    }
    .login-card h1 {
      text-align: center;
      color: #4f46e5;
      margin-bottom: 8px;
    }
    .login-card h2 {
      text-align: center;
      color: #6b7280;
      font-size: 16px;
      font-weight: normal;
      margin-bottom: 32px;
    }
    .btn-block {
      width: 100%;
      padding: 12px;
      font-size: 16px;
    }
    .login-info {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 13px;
      color: #6b7280;
      text-align: center;
    }
    .login-info p {
      margin: 4px 0;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  credentials = {
    usuario: '',
    password: ''
  };

  loading = false;
  errorMessage = '';

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Usuario o contraseña incorrectos';
        console.error('Login error:', error);
      }
    });
  }
}
