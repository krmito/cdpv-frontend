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
      <a routerLink="/dashboard" routerLinkActive="active" class="menu-item">
        📊 Dashboard
      </a>
      <a routerLink="/jugadores" routerLinkActive="active" class="menu-item">
        👥 Jugadores
      </a>
      @if (canAccessCategorias()) {
        <a routerLink="/categorias" routerLinkActive="active" class="menu-item">
          📁 Categorias
        </a>
      }
      @if (canAccessPagos()) {
        <a routerLink="/pagos" routerLinkActive="active" class="menu-item">
          💰 Pagos
        </a>
      }
      <a routerLink="/mensualidades" routerLinkActive="active" class="menu-item">
        📅 Mensualidades
      </a>
      <a routerLink="/reportes" routerLinkActive="active" class="menu-item">
        📈 Reportes
      </a>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      background: white;
      height: calc(100vh - 64px);
      box-shadow: 2px 0 4px rgba(0,0,0,0.1);
      padding: 20px 0;
    }
    .menu-item {
      display: block;
      padding: 12px 24px;
      color: #4b5563;
      text-decoration: none;
      transition: all 0.2s;
      font-size: 15px;
    }
    .menu-item:hover {
      background: #f3f4f6;
      color: #4f46e5;
    }
    .menu-item.active {
      background: #eef2ff;
      color: #4f46e5;
      border-right: 3px solid #4f46e5;
      font-weight: 600;
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
