import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <!-- Partículas animadas de fondo -->
      <div class="particles">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
      </div>

      <!-- Líneas de energía -->
      <div class="energy-lines">
        <div class="line"></div>
        <div class="line"></div>
        <div class="line"></div>
      </div>

      <div class="login-card">
        <!-- Escudo con efecto glow -->
        <div class="logo-container">
          <div class="logo-glow"></div>
          <img src="assets/escudo2.png" alt="Club Deportivo Pancho Villegas" class="logo" />
        </div>

        <h1>Club Deportivo</h1>
        <h2>Pancho Villegas</h2>
        <p class="subtitle">Sistema de Gestión</p>

        @if (errorMessage) {
          <div class="alert alert-danger" role="alert" aria-live="assertive">
            <span class="alert-icon">⚠️</span>
            {{ errorMessage }}
          </div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>
              <span class="label-icon">👤</span>
              Usuario
            </label>
            <div class="input-wrapper">
              <input
                type="text"
                class="form-control"
                [(ngModel)]="credentials.usuario"
                name="usuario"
                required
                placeholder="Ingresa tu usuario"
                autocomplete="username"
              />
              <div class="input-glow"></div>
            </div>
          </div>

          <div class="form-group">
            <label>
              <span class="label-icon">🔒</span>
              Contraseña
            </label>
            <div class="input-wrapper">
              <input
                type="password"
                class="form-control"
                [(ngModel)]="credentials.password"
                name="password"
                required
                placeholder="••••••••"
                autocomplete="current-password"
              />
              <div class="input-glow"></div>
            </div>
          </div>

          <button type="submit" class="btn-login" [disabled]="loading" [class.loading]="loading">
            <span class="btn-text">{{ loading ? 'Verificando...' : 'Ingresar al Sistema' }}</span>
            <span class="btn-icon">→</span>
            <div class="btn-shine"></div>
          </button>
        </form>

        <div class="footer-text">
          <span class="pulse-dot"></span>
          Sistema activo y protegido
        </div>
      </div>

      <!-- Mensaje de éxito flotante (login) -->
      @if (successMessage) {
        <div class="success-toast">
          <div class="toast-icon">✓</div>
          <div class="toast-content">
            <span class="toast-title">¡Bienvenido!</span>
            <span class="toast-message">{{ successMessage }}</span>
          </div>
        </div>
      }

      <!-- Mensaje de despedida flotante (logout) -->
      @if (logoutMessage) {
        <div class="logout-toast">
          <div class="toast-icon">👋</div>
          <div class="toast-content">
            <span class="toast-title">¡Hasta pronto!</span>
            <span class="toast-message">{{ logoutMessage }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  credentials = {
    usuario: '',
    password: ''
  };

  loading = false;
  errorMessage = '';
  successMessage = '';
  logoutMessage = '';

  ngOnInit() {
    // Verificar si viene de un logout
    this.route.queryParams.subscribe(params => {
      if (params['logout'] === 'success') {
        const name = params['name'] || 'Usuario';
        this.logoutMessage = `Sesión de ${name} cerrada correctamente`;

        // Ocultar el mensaje después de 4 segundos
        setTimeout(() => {
          this.logoutMessage = '';
        }, 4000);

        // Limpiar los query params de la URL
        this.router.navigate([], { queryParams: {} });
      }
    });
  }

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.loading = false;
        const userName = this.authService.currentUser()?.nombre || 'Usuario';
        this.successMessage = `Ingresando como ${userName}...`;

        // Esperar un momento para mostrar el mensaje antes de redirigir
        setTimeout(() => {
          const rol = this.authService.currentUser()?.rol;
          const destino = rol === 'acudiente' ? '/portal/mis-hijos' : '/dashboard';
          this.router.navigate([destino]);
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Usuario o contraseña incorrectos';
        console.error('Login error:', error);
      }
    });
  }
}
