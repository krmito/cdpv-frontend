import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <h2>⚽ Club Deportivo Pancho Villegas</h2>
      </div>
      <div class="navbar-user">
        <span>{{ authService.currentUser()?.nombre }}</span>
        <span class="badge">{{ authService.currentUser()?.rol }}</span>
        <button class="btn btn-sm" (click)="logout()">Salir</button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: white;
      padding: 16px 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .navbar-brand h2 {
      margin: 0;
      color: #4f46e5;
      font-size: 24px;
    }
    .navbar-user {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .badge {
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }
    .btn-sm {
      padding: 6px 16px;
      font-size: 14px;
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
