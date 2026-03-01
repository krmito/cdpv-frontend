import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';
import { PermisosService } from '../../core/services/permisos.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Overlay para cerrar el menú en móvil -->
    <div
      class="sidebar-overlay"
      [class.active]="uiService.sidebarOpen()"
      (click)="uiService.closeSidebar()">
    </div>

    <aside
      class="sidebar"
      [class.open]="uiService.sidebarOpen()"
      [class.collapsed]="uiService.sidebarCollapsed()">

      <!-- Logo del club -->
      <div class="logo-section">
        <div class="logo-container">
          <img src="assets/escudo2.png" alt="Club Deportivo Pancho Villegas" class="logo" />
        </div>
        <div class="club-name">
          <span class="name-line">Club Deportivo</span>
          <span class="name-line primary">Pancho Villegas</span>
        </div>
      </div>

      <div class="menu-divider"></div>

      <nav class="menu">
        @if (isAcudiente()) {
          <a routerLink="/portal/mis-hijos" routerLinkActive="active" class="menu-item" data-label="Mis Hijos" (click)="onMenuItemClick()">
            <span class="menu-icon">👨‍👧‍👦</span>
            <span class="menu-text">Mis Hijos</span>
          </a>
          <a routerLink="/ayuda" routerLinkActive="active" class="menu-item" data-label="Ayuda" (click)="onMenuItemClick()">
            <span class="menu-icon">❓</span>
            <span class="menu-text">Ayuda</span>
          </a>
        }
        @if (!isAcudiente()) {
          <a routerLink="/dashboard" routerLinkActive="active" class="menu-item" data-label="Dashboard" (click)="onMenuItemClick()">
            <span class="menu-icon">📊</span>
            <span class="menu-text">Dashboard</span>
          </a>
          @if (isAdmin() || permisosService.canView('jugadores')) {
            <a routerLink="/jugadores" routerLinkActive="active" class="menu-item" data-label="Jugadores" (click)="onMenuItemClick()">
              <span class="menu-icon">👥</span>
              <span class="menu-text">Jugadores</span>
            </a>
          }
          @if (isAdmin() || permisosService.canView('categorias')) {
            <a routerLink="/categorias" routerLinkActive="active" class="menu-item" data-label="Categorías" (click)="onMenuItemClick()">
              <span class="menu-icon">📁</span>
              <span class="menu-text">Categorías</span>
            </a>
          }
          @if (isAdmin() || permisosService.canView('pagos')) {
            <a routerLink="/pagos" routerLinkActive="active" class="menu-item" data-label="Pagos" (click)="onMenuItemClick()">
              <span class="menu-icon">💰</span>
              <span class="menu-text">Pagos</span>
            </a>
          }
          @if (isAdmin() || permisosService.canView('mensualidades')) {
            <a routerLink="/mensualidades" routerLinkActive="active" class="menu-item" data-label="Mensualidades" (click)="onMenuItemClick()">
              <span class="menu-icon">📅</span>
              <span class="menu-text">Mensualidades</span>
            </a>
          }
          @if (isAdmin() || permisosService.canView('reportes')) {
            <a routerLink="/reportes" routerLinkActive="active" class="menu-item" data-label="Reportes" (click)="onMenuItemClick()">
              <span class="menu-icon">📈</span>
              <span class="menu-text">Reportes</span>
            </a>
          }
          @if (isAdmin()) {
            <a routerLink="/usuarios" routerLinkActive="active" class="menu-item" data-label="Usuarios" (click)="onMenuItemClick()">
              <span class="menu-icon">🔐</span>
              <span class="menu-text">Usuarios</span>
            </a>
          }
          <a routerLink="/ayuda" routerLinkActive="active" class="menu-item" data-label="Ayuda" (click)="onMenuItemClick()">
            <span class="menu-icon">❓</span>
            <span class="menu-text">Ayuda</span>
          </a>
        }
      </nav>
    </aside>
  `,
  styles: [`
    :host {
      --primary-blue: #1a3a5c;
      --primary-yellow: #ffde00;
      --dark-blue: #0d1f33;
      --sidebar-width: 260px;
      --sidebar-collapsed-width: 64px;
    }

    /* === OVERLAY (móvil) === */
    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 199;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .sidebar-overlay.active {
      opacity: 1;
    }

    /* === SIDEBAR === */
    .sidebar {
      width: var(--sidebar-width);
      background: linear-gradient(180deg, var(--primary-blue) 0%, var(--dark-blue) 100%);
      height: calc(100vh - 64px);
      box-shadow: 4px 0 15px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: width 0.3s ease;
      /* Sin overflow:hidden para que los tooltips se vean fuera del sidebar */
      overflow: visible;
    }

    /* === LOGO SECTION === */
    .logo-section {
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: linear-gradient(180deg, rgba(255, 222, 0, 0.1) 0%, transparent 100%);
      overflow: hidden;
      transition: padding 0.3s ease;
    }

    .logo-container {
      width: 72px;
      height: 72px;
      border-radius: 14px;
      padding: 4px;
      background: white;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3), 0 0 20px rgba(255,222,0,0.2);
      transition: width 0.3s ease, height 0.3s ease, border-radius 0.3s ease;
      animation: logo-glow 3s infinite ease-in-out;
      flex-shrink: 0;
    }

    @keyframes logo-glow {
      0%, 100% { box-shadow: 0 8px 25px rgba(0,0,0,0.3), 0 0 20px rgba(255,222,0,0.2); }
      50%       { box-shadow: 0 8px 25px rgba(0,0,0,0.3), 0 0 30px rgba(255,222,0,0.4); }
    }

    .logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 10px;
    }

    .club-name {
      margin-top: 14px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
      max-height: 60px;
      opacity: 1;
      transition: max-height 0.3s ease, opacity 0.2s ease, margin-top 0.3s ease;
    }

    .name-line {
      font-size: 11px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
      letter-spacing: 2px;
      white-space: nowrap;
    }

    .name-line.primary {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary-yellow);
      letter-spacing: 1px;
    }

    /* === DIVIDER === */
    .menu-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,222,0,0.3), transparent);
      margin: 0 16px;
      flex-shrink: 0;
    }

    /* === MENU === */
    .menu {
      flex: 1;
      padding: 12px 0;
      overflow-y: auto;
      overflow-x: visible;
    }

    .menu::-webkit-scrollbar { width: 4px; }
    .menu::-webkit-scrollbar-track { background: transparent; }
    .menu::-webkit-scrollbar-thumb { background: rgba(255,222,0,0.3); border-radius: 2px; }
    .menu::-webkit-scrollbar-thumb:hover { background: rgba(255,222,0,0.5); }

    /* === MENU ITEM === */
    .menu-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 13px 20px;
      color: rgba(255, 255, 255, 0.75);
      text-decoration: none;
      transition: background 0.25s ease, color 0.25s ease, padding 0.3s ease, justify-content 0.3s ease;
      font-size: 14px;
      font-weight: 500;
      position: relative;
      margin: 3px 10px;
      border-radius: 10px;
      white-space: nowrap;
      overflow: visible;
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

    .menu-item:hover::before { height: 60%; }

    .menu-item.active {
      background: rgba(255, 222, 0, 0.15);
      color: var(--primary-yellow);
    }

    .menu-item.active::before {
      height: 70%;
      box-shadow: 0 0 10px rgba(255,222,0,0.5);
    }

    .menu-icon {
      font-size: 18px;
      width: 22px;
      text-align: center;
      flex-shrink: 0;
      transition: transform 0.25s ease;
    }

    .menu-item:hover .menu-icon { transform: scale(1.15); }

    .menu-text {
      overflow: hidden;
      max-width: 180px;
      opacity: 1;
      transition: max-width 0.3s ease, opacity 0.2s ease;
      letter-spacing: 0.4px;
    }

    /* =============================================
       DESKTOP — COLAPSADO (solo íconos)
       ============================================= */
    @media (min-width: 769px) {
      .sidebar.collapsed {
        width: var(--sidebar-collapsed-width);
      }

      /* Logo pequeño y centrado */
      .sidebar.collapsed .logo-section {
        padding: 14px 10px;
      }

      .sidebar.collapsed .logo-container {
        width: 40px;
        height: 40px;
        border-radius: 10px;
      }

      /* Ocultar nombre del club */
      .sidebar.collapsed .club-name {
        max-height: 0;
        opacity: 0;
        margin-top: 0;
      }

      /* Centrar ítems y ocultar texto */
      .sidebar.collapsed .menu-item {
        justify-content: center;
        padding: 13px 0;
        margin: 3px 8px;
        gap: 0;
      }

      .sidebar.collapsed .menu-text {
        max-width: 0;
        opacity: 0;
      }

      /* Indicador activo */
      .sidebar.collapsed .menu-item::before {
        border-radius: 3px 0 0 3px;
        left: auto;
        right: 0;
      }

      /* Tooltip al hacer hover sobre ítem colapsado */
      .sidebar.collapsed .menu-item::after {
        content: attr(data-label);
        position: absolute;
        left: calc(100% + 10px);
        top: 50%;
        transform: translateY(-50%);
        background: var(--dark-blue);
        color: white;
        padding: 6px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        border: 1px solid rgba(255,222,0,0.15);
        z-index: 300;
      }

      .sidebar.collapsed .menu-item:hover::after {
        opacity: 1;
      }
    }

    /* =============================================
       MÓVIL — Drawer deslizable (sin cambios)
       ============================================= */
    @media (max-width: 768px) {
      .sidebar-overlay {
        display: block;
        pointer-events: none;
      }

      .sidebar-overlay.active {
        pointer-events: auto;
      }

      .sidebar {
        position: fixed;
        top: 0; left: 0;
        height: 100vh;
        z-index: 200;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        width: var(--sidebar-width) !important;
        overflow: hidden;
      }

      .sidebar.open {
        transform: translateX(0);
      }

      .logo-section {
        padding: 20px 16px;
      }

      .logo-container {
        width: 60px;
        height: 60px;
      }

      .club-name {
        margin-top: 12px;
      }

      .menu-item {
        padding: 12px 20px;
        margin: 3px 10px;
      }
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
  uiService = inject(UiService);
  permisosService = inject(PermisosService);

  isAdmin(): boolean {
    return this.authService.hasRole(['administrador']);
  }

  isAcudiente(): boolean {
    return this.authService.hasRole(['acudiente']);
  }

  onMenuItemClick(): void {
    if (window.innerWidth <= 768) {
      this.uiService.closeSidebar();
    }
  }
}
