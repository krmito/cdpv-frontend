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
          <img src="assets/escudo.jpg" alt="Club Deportivo Pancho Villegas" class="logo" />
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
  styles: [`
    /* === VARIABLES === */
    :host {
      --primary-blue: #1a3a5c;
      --primary-yellow: #ffde00;
      --dark-blue: #0d1f33;
      --light-yellow: #fff176;
      --glow-yellow: rgba(255, 222, 0, 0.6);
      --glow-blue: rgba(26, 58, 92, 0.8);
    }

    /* === CONTENEDOR PRINCIPAL === */
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--dark-blue) 0%, var(--primary-blue) 50%, #2d4a6a 100%);
      position: relative;
      overflow: hidden;
    }

    /* === PARTÍCULAS FLOTANTES === */
    .particles {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 1;
    }

    .particle {
      position: absolute;
      width: 10px;
      height: 10px;
      background: var(--primary-yellow);
      border-radius: 50%;
      opacity: 0.3;
      animation: float 15s infinite ease-in-out;
    }

    .particle:nth-child(1) { left: 10%; top: 20%; animation-delay: 0s; width: 8px; height: 8px; }
    .particle:nth-child(2) { left: 20%; top: 80%; animation-delay: 2s; width: 12px; height: 12px; }
    .particle:nth-child(3) { left: 60%; top: 10%; animation-delay: 4s; width: 6px; height: 6px; }
    .particle:nth-child(4) { left: 80%; top: 50%; animation-delay: 6s; width: 14px; height: 14px; }
    .particle:nth-child(5) { left: 30%; top: 60%; animation-delay: 8s; width: 10px; height: 10px; }
    .particle:nth-child(6) { left: 70%; top: 80%; animation-delay: 10s; width: 8px; height: 8px; }
    .particle:nth-child(7) { left: 90%; top: 30%; animation-delay: 12s; width: 6px; height: 6px; }
    .particle:nth-child(8) { left: 5%; top: 90%; animation-delay: 14s; width: 12px; height: 12px; }

    @keyframes float {
      0%, 100% {
        transform: translateY(0) translateX(0) scale(1);
        opacity: 0.3;
      }
      25% {
        transform: translateY(-100px) translateX(20px) scale(1.2);
        opacity: 0.6;
      }
      50% {
        transform: translateY(-50px) translateX(-20px) scale(0.8);
        opacity: 0.4;
      }
      75% {
        transform: translateY(-150px) translateX(10px) scale(1.1);
        opacity: 0.5;
      }
    }

    /* === LÍNEAS DE ENERGÍA === */
    .energy-lines {
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: none;
    }

    .line {
      position: absolute;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--primary-yellow), transparent);
      opacity: 0.3;
      animation: energy-flow 8s infinite linear;
    }

    .line:nth-child(1) { top: 20%; width: 100%; animation-delay: 0s; }
    .line:nth-child(2) { top: 50%; width: 100%; animation-delay: 3s; }
    .line:nth-child(3) { top: 80%; width: 100%; animation-delay: 6s; }

    @keyframes energy-flow {
      0% { transform: translateX(-100%); opacity: 0; }
      50% { opacity: 0.5; }
      100% { transform: translateX(100%); opacity: 0; }
    }

    /* === CARD DE LOGIN === */
    .login-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      padding: 40px 45px;
      border-radius: 24px;
      box-shadow:
        0 25px 60px rgba(0, 0, 0, 0.4),
        0 0 40px rgba(255, 222, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
      width: 100%;
      max-width: 420px;
      position: relative;
      z-index: 10;
      border: 1px solid rgba(255, 222, 0, 0.2);
      animation: card-appear 0.8s ease-out;
    }

    @keyframes card-appear {
      0% {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* === LOGO/ESCUDO === */
    .logo-container {
      position: relative;
      width: 140px;
      height: 140px;
      margin: -70px auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-glow {
      position: absolute;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, var(--glow-yellow) 0%, transparent 70%);
      border-radius: 50%;
      animation: logo-pulse 3s infinite ease-in-out;
      z-index: 1;
    }

    @keyframes logo-pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 0.5;
      }
      50% {
        transform: scale(1.15);
        opacity: 0.8;
      }
    }

    .logo {
      width: 120px;
      height: 120px;
      object-fit: contain;
      border-radius: 16px;
      position: relative;
      z-index: 2;
      filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.3));
      animation: logo-float 4s infinite ease-in-out;
      background: white;
      padding: 5px;
    }

    @keyframes logo-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    /* === TÍTULOS === */
    .login-card h1 {
      text-align: center;
      color: var(--primary-blue);
      margin: 0;
      font-size: 28px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .login-card h2 {
      text-align: center;
      color: var(--primary-blue);
      font-size: 22px;
      font-weight: 700;
      margin: 4px 0 8px;
      text-transform: uppercase;
      letter-spacing: 3px;
    }

    .subtitle {
      text-align: center;
      color: #64748b;
      font-size: 14px;
      margin: 0 0 28px;
      font-weight: 500;
      letter-spacing: 1px;
    }

    /* === FORMULARIO === */
    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-blue);
      margin-bottom: 8px;
    }

    .label-icon {
      font-size: 16px;
    }

    .input-wrapper {
      position: relative;
    }

    .form-control {
      width: 100%;
      padding: 14px 18px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 15px;
      transition: all 0.3s ease;
      background: #f8fafc;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary-yellow);
      background: white;
      box-shadow: 0 0 0 4px rgba(255, 222, 0, 0.2);
    }

    .form-control::placeholder {
      color: #94a3b8;
    }

    .input-glow {
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, var(--primary-yellow), transparent);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .form-control:focus + .input-glow {
      width: 80%;
    }

    /* === BOTÓN LOGIN === */
    .btn-login {
      width: 100%;
      padding: 16px 24px;
      background: linear-gradient(135deg, var(--primary-blue) 0%, #2d4a6a 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 8px;
    }

    .btn-login:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow:
        0 10px 30px rgba(26, 58, 92, 0.4),
        0 0 20px rgba(255, 222, 0, 0.3);
      background: linear-gradient(135deg, #2d4a6a 0%, var(--primary-blue) 100%);
    }

    .btn-login:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-login:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .btn-icon {
      font-size: 20px;
      transition: transform 0.3s ease;
    }

    .btn-login:hover:not(:disabled) .btn-icon {
      transform: translateX(5px);
    }

    .btn-shine {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 222, 0, 0.3), transparent);
      transition: left 0.5s ease;
    }

    .btn-login:hover:not(:disabled) .btn-shine {
      left: 100%;
    }

    .btn-login.loading {
      background: linear-gradient(135deg, #4a6a8a 0%, #3d5a7a 100%);
    }

    .btn-login.loading .btn-icon {
      animation: spin 1s infinite linear;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* === ALERTA === */
    .alert-danger {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 14px 18px;
      border-radius: 12px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 500;
      animation: shake 0.5s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    /* === FOOTER === */
    .footer-text {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse-dot 2s infinite;
    }

    @keyframes pulse-dot {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
      }
    }

    /* === RESPONSIVE === */
    @media (max-width: 480px) {
      .login-card {
        margin: 20px;
        padding: 30px 25px;
      }

      .logo-container {
        width: 120px;
        height: 120px;
        margin-top: -60px;
      }

      .logo {
        width: 100px;
        height: 100px;
      }

      .login-card h1 {
        font-size: 22px;
      }

      .login-card h2 {
        font-size: 18px;
      }
    }

    /* === TOAST DE ÉXITO === */
    .success-toast {
      position: fixed;
      top: 30px;
      right: 30px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 20px 28px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow:
        0 10px 40px rgba(16, 185, 129, 0.4),
        0 0 30px rgba(16, 185, 129, 0.2);
      z-index: 1000;
      animation: toast-slide-in 0.5s ease-out, toast-pulse 2s infinite ease-in-out 0.5s;
    }

    @keyframes toast-slide-in {
      0% {
        opacity: 0;
        transform: translateX(100px) scale(0.8);
      }
      100% {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    @keyframes toast-pulse {
      0%, 100% {
        box-shadow:
          0 10px 40px rgba(16, 185, 129, 0.4),
          0 0 30px rgba(16, 185, 129, 0.2);
      }
      50% {
        box-shadow:
          0 10px 50px rgba(16, 185, 129, 0.5),
          0 0 50px rgba(16, 185, 129, 0.3);
      }
    }

    .toast-icon {
      width: 45px;
      height: 45px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      animation: icon-bounce 0.6s ease-out 0.3s;
    }

    @keyframes icon-bounce {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    .toast-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .toast-title {
      font-size: 18px;
      font-weight: 700;
    }

    .toast-message {
      font-size: 14px;
      opacity: 0.9;
    }

    @media (max-width: 480px) {
      .success-toast {
        top: 20px;
        right: 20px;
        left: 20px;
        padding: 16px 20px;
      }
    }

    /* === TOAST DE LOGOUT === */
    .logout-toast {
      position: fixed;
      top: 30px;
      right: 30px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      padding: 20px 28px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow:
        0 10px 40px rgba(59, 130, 246, 0.4),
        0 0 30px rgba(59, 130, 246, 0.2);
      z-index: 1000;
      animation: toast-slide-in 0.5s ease-out, toast-pulse-blue 2s infinite ease-in-out 0.5s;
    }

    @keyframes toast-pulse-blue {
      0%, 100% {
        box-shadow:
          0 10px 40px rgba(59, 130, 246, 0.4),
          0 0 30px rgba(59, 130, 246, 0.2);
      }
      50% {
        box-shadow:
          0 10px 50px rgba(59, 130, 246, 0.5),
          0 0 50px rgba(59, 130, 246, 0.3);
      }
    }

    .logout-toast .toast-icon {
      width: 45px;
      height: 45px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      animation: icon-bounce 0.6s ease-out 0.3s;
    }

    @media (max-width: 480px) {
      .logout-toast {
        top: 20px;
        right: 20px;
        left: 20px;
        padding: 16px 20px;
      }
    }
  `]
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
