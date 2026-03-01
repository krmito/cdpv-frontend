import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="navbar">
      <div class="navbar-left">
        <button class="menu-toggle" (click)="uiService.toggleMenu()" aria-label="Menú">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
        <div class="navbar-brand">
          <div class="logo-wrapper">
            <img src="assets/escudo2.png" alt="Escudo" class="navbar-logo" />
          </div>
          <div class="brand-text">
            <span class="brand-title">Club Deportivo</span>
            <span class="brand-name">Pancho Villegas</span>
          </div>
        </div>
      </div>

      <div class="navbar-center">
        <span class="system-title">Sistema de Gestión</span>
      </div>

      <div class="navbar-user">
        <div class="user-info">
          <span class="user-name">{{ authService.currentUser()?.nombre }}</span>
        </div>
        <div class="user-avatar">
          {{ getInitials() }}
        </div>
        <button class="btn-logout" (click)="logout()" aria-label="Cerrar sesión">
          <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span class="btn-text">Salir</span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    :host {
      --primary-blue: #1a3a5c;
      --primary-yellow: #ffde00;
      --dark-blue: #0d1f33;
    }

    .navbar {
      background: linear-gradient(90deg, var(--primary-blue) 0%, var(--dark-blue) 100%);
      padding: 12px 24px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 100;
    }

    /* === LEFT === */
    .navbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .menu-toggle {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 40px;
      height: 40px;
      padding: 8px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      flex-shrink: 0;
    }

    .menu-toggle:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .hamburger-line {
      width: 100%;
      height: 2px;
      background: white;
      border-radius: 2px;
      transition: all 0.3s ease;
    }

    /* === BRAND === */
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo-wrapper {
      width: 45px;
      height: 45px;
      border-radius: 10px;
      background: white;
      padding: 3px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }

    .logo-wrapper:hover {
      transform: scale(1.05);
      box-shadow:
        0 6px 20px rgba(0, 0, 0, 0.3),
        0 0 15px rgba(255, 222, 0, 0.3);
    }

    .navbar-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 8px;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .brand-title {
      font-size: 11px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      line-height: 1.2;
    }

    .brand-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--primary-yellow);
      letter-spacing: 0.5px;
      line-height: 1.2;
    }

    /* === CENTER === */
    .navbar-center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
    }

    .system-title {
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 8px 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.05);
    }

    /* === USER === */
    .navbar-user {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: white;
    }

    .user-role {
      font-size: 11px;
      font-weight: 500;
      color: var(--primary-yellow);
      text-transform: capitalize;
      padding: 2px 10px;
      background: rgba(255, 222, 0, 0.15);
      border-radius: 10px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary-yellow) 0%, #ffc107 100%);
      color: var(--dark-blue);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(255, 222, 0, 0.3);
      transition: all 0.3s ease;
    }

    .user-avatar:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(255, 222, 0, 0.4);
    }

    .btn-logout {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      color: white;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-logout:hover {
      background: rgba(239, 68, 68, 0.9);
      border-color: rgba(239, 68, 68, 0.9);
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
      transform: translateY(-1px);
    }

    .btn-icon {
      display: block;
      flex-shrink: 0;
    }

    /* === RESPONSIVE === */
    @media (max-width: 768px) {
      .navbar {
        padding: 10px 16px;
      }

      .navbar-center {
        display: none;
      }

      .brand-text {
        display: none;
      }

      .user-info {
        display: none;
      }

      .btn-text {
        display: none;
      }

      .btn-logout {
        padding: 10px;
      }

      .logo-wrapper {
        width: 38px;
        height: 38px;
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        font-size: 12px;
      }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  uiService = inject(UiService);

  logout() {
    this.authService.logout();
  }

  getInitials(): string {
    const nombre = this.authService.currentUser()?.nombre || '';
    const parts = nombre.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }
}
