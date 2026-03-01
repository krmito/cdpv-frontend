import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';
import { PermisosService } from '../../core/services/permisos.service';
import { BREAKPOINTS } from '../../core/constants/app.constants';

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
  styleUrl: './sidebar.component.css'
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
    if (window.innerWidth <= BREAKPOINTS.MOBILE) {
      this.uiService.closeSidebar();
    }
  }
}
