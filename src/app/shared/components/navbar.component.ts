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
  styleUrl: './navbar.component.css'
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
