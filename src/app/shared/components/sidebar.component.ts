import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <!-- Logo del club -->
      <div class="logo-section">
        <div class="logo-container">
          <img src="assets/escudo.jpg" alt="Club Deportivo Pancho Villegas" class="logo" />
        </div>
        <div class="club-name">
          <span class="name-line">Club Deportivo</span>
          <span class="name-line primary">Pancho Villegas</span>
        </div>
      </div>

      <div class="menu-divider"></div>

      <nav class="menu">
        <a routerLink="/dashboard" routerLinkActive="active" class="menu-item">
          <span class="menu-icon">📊</span>
          <span class="menu-text">Dashboard</span>
        </a>
        <a routerLink="/jugadores" routerLinkActive="active" class="menu-item">
          <span class="menu-icon">👥</span>
          <span class="menu-text">Jugadores</span>
        </a>
        @if (canAccessCategorias()) {
          <a routerLink="/categorias" routerLinkActive="active" class="menu-item">
            <span class="menu-icon">📁</span>
            <span class="menu-text">Categorías</span>
          </a>
        }
        @if (canAccessPagos()) {
          <a routerLink="/pagos" routerLinkActive="active" class="menu-item">
            <span class="menu-icon">💰</span>
            <span class="menu-text">Pagos</span>
          </a>
        }
        <a routerLink="/mensualidades" routerLinkActive="active" class="menu-item">
          <span class="menu-icon">📅</span>
          <span class="menu-text">Mensualidades</span>
        </a>
        <a routerLink="/reportes" routerLinkActive="active" class="menu-item">
          <span class="menu-icon">📈</span>
          <span class="menu-text">Reportes</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    :host {
      --primary-blue: #1a3a5c;
      --primary-yellow: #ffde00;
      --dark-blue: #0d1f33;
    }

    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, var(--primary-blue) 0%, var(--dark-blue) 100%);
      height: calc(100vh - 64px);
      box-shadow: 4px 0 15px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* === LOGO SECTION === */
    .logo-section {
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: linear-gradient(180deg, rgba(255, 222, 0, 0.1) 0%, transparent 100%);
    }

    .logo-container {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      padding: 4px;
      background: white;
      box-shadow:
        0 8px 25px rgba(0, 0, 0, 0.3),
        0 0 20px rgba(255, 222, 0, 0.2);
      transition: all 0.3s ease;
      animation: logo-glow 3s infinite ease-in-out;
    }

    .logo-container:hover {
      transform: scale(1.05);
      box-shadow:
        0 12px 35px rgba(0, 0, 0, 0.4),
        0 0 30px rgba(255, 222, 0, 0.4);
    }

    @keyframes logo-glow {
      0%, 100% {
        box-shadow:
          0 8px 25px rgba(0, 0, 0, 0.3),
          0 0 20px rgba(255, 222, 0, 0.2);
      }
      50% {
        box-shadow:
          0 8px 25px rgba(0, 0, 0, 0.3),
          0 0 30px rgba(255, 222, 0, 0.4);
      }
    }

    .logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 12px;
    }

    .club-name {
      margin-top: 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .name-line {
      font-size: 12px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .name-line.primary {
      font-size: 14px;
      font-weight: 700;
      color: var(--primary-yellow);
      letter-spacing: 1px;
    }

    /* === DIVIDER === */
    .menu-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 222, 0, 0.3), transparent);
      margin: 0 20px;
    }

    /* === MENU === */
    .menu {
      flex: 1;
      padding: 16px 0;
      overflow-y: auto;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 24px;
      color: rgba(255, 255, 255, 0.75);
      text-decoration: none;
      transition: all 0.3s ease;
      font-size: 14px;
      font-weight: 500;
      position: relative;
      margin: 4px 12px;
      border-radius: 10px;
    }

    .menu-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 0;
      background: var(--primary-yellow);
      border-radius: 0 3px 3px 0;
      transition: height 0.3s ease;
    }

    .menu-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .menu-item:hover::before {
      height: 60%;
    }

    .menu-item.active {
      background: rgba(255, 222, 0, 0.15);
      color: var(--primary-yellow);
    }

    .menu-item.active::before {
      height: 70%;
      box-shadow: 0 0 10px rgba(255, 222, 0, 0.5);
    }

    .menu-icon {
      font-size: 18px;
      width: 24px;
      text-align: center;
      transition: transform 0.3s ease;
    }

    .menu-item:hover .menu-icon {
      transform: scale(1.15);
    }

    .menu-text {
      letter-spacing: 0.5px;
    }

    /* Scrollbar personalizado */
    .menu::-webkit-scrollbar {
      width: 4px;
    }

    .menu::-webkit-scrollbar-track {
      background: transparent;
    }

    .menu::-webkit-scrollbar-thumb {
      background: rgba(255, 222, 0, 0.3);
      border-radius: 2px;
    }

    .menu::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 222, 0, 0.5);
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);

  canAccessPagos(): boolean {
    return this.authService.hasRole(['administrador', 'tesorero']);
  }

  canAccessCategorias(): boolean {
    return this.authService.hasRole(['administrador', 'tesorero']);
  }
}
