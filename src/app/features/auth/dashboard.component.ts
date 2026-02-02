import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar.component';

interface Estadisticas {
  jugadores: {
    total: number;
    activos: number;
    inactivos: number;
  };
  mes_actual: {
    recaudado: number;
    total_pagos: number;
  };
  mensualidades: {
    pendientes: number;
    vencidas: number;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  template: `
    <div class="layout">
      <app-navbar/>
      <div class="main-container">
        <app-sidebar/>
        <main class="content">
          <!-- Banner de bienvenida con escudo -->
          <div class="welcome-banner">
            <div class="banner-bg"></div>
            <div class="banner-content">
              <div class="banner-logo">
                <img src="assets/escudo.jpg" alt="Escudo" class="escudo" />
              </div>
              <div class="banner-text">
                <h1>Bienvenido al Sistema</h1>
                <p class="welcome-name">{{ authService.currentUser()?.nombre }}</p>
                <span class="welcome-date">{{ getCurrentDate() }}</span>
              </div>
            </div>
            <div class="banner-decoration">
              <div class="circle c1"></div>
              <div class="circle c2"></div>
              <div class="circle c3"></div>
            </div>
          </div>

          @if (loading) {
            <div class="loading">
              <div class="loading-spinner"></div>
              <p>Cargando estadísticas...</p>
            </div>
          } @else if (error) {
            <div class="alert alert-danger">
              <strong>Error:</strong> {{ error }}
              <br>
              <small>Verifica que el backend esté corriendo</small>
            </div>
          } @else {
            <div class="stats-grid">
              <div class="stat-card card-jugadores">
                <div class="stat-icon">👥</div>
                <div class="stat-info">
                  <h3>Jugadores Activos</h3>
                  <div class="value">{{ stats.jugadores?.activos || 0 }}</div>
                  <p class="subtitle">de {{ stats.jugadores?.total || 0 }} totales</p>
                </div>
              </div>

              <div class="stat-card card-recaudado">
                <div class="stat-icon">💰</div>
                <div class="stat-info">
                  <h3>Recaudado Este Mes</h3>
                  <div class="value">\${{ formatNumber(stats.mes_actual?.recaudado || 0) }}</div>
                  <p class="subtitle">{{ stats.mes_actual?.total_pagos || 0 }} pagos registrados</p>
                </div>
              </div>

              <div class="stat-card card-pendientes">
                <div class="stat-icon">📋</div>
                <div class="stat-info">
                  <h3>Mensualidades Pendientes</h3>
                  <div class="value">{{ stats.mensualidades?.pendientes || 0 }}</div>
                  <p class="subtitle">Por cobrar</p>
                </div>
              </div>

              <div class="stat-card card-vencidas">
                <div class="stat-icon">⚠️</div>
                <div class="stat-info">
                  <h3>Mensualidades Vencidas</h3>
                  <div class="value">{{ stats.mensualidades?.vencidas || 0 }}</div>
                  <p class="subtitle">Requieren atención</p>
                </div>
              </div>
            </div>

            <div class="card actions-card">
              <div class="card-header">
                <span class="header-icon">⚡</span>
                Acciones Rápidas
              </div>
              <div class="actions-grid">
                <button class="action-btn btn-jugadores" (click)="navigate('/jugadores')">
                  <span class="btn-icon">👥</span>
                  <span class="btn-label">Ver Jugadores</span>
                </button>
                @if (canAccessPagos()) {
                  <button class="action-btn btn-pagos" (click)="navigate('/pagos')">
                    <span class="btn-icon">💰</span>
                    <span class="btn-label">Registrar Pago</span>
                  </button>
                }
                <button class="action-btn btn-mensualidades" (click)="navigate('/mensualidades')">
                  <span class="btn-icon">📅</span>
                  <span class="btn-label">Mensualidades</span>
                </button>
                <button class="action-btn btn-reportes" (click)="navigate('/reportes')">
                  <span class="btn-icon">📈</span>
                  <span class="btn-label">Ver Reportes</span>
                </button>
              </div>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary-blue: #1a3a5c;
      --primary-yellow: #ffde00;
      --dark-blue: #0d1f33;
    }

    .layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .main-container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
    }

    /* === WELCOME BANNER === */
    .welcome-banner {
      background: linear-gradient(135deg, var(--primary-blue) 0%, var(--dark-blue) 100%);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 28px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(26, 58, 92, 0.3);
    }

    .banner-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 24px;
      position: relative;
      z-index: 2;
    }

    .banner-logo {
      width: 90px;
      height: 90px;
      background: white;
      border-radius: 18px;
      padding: 6px;
      box-shadow:
        0 8px 25px rgba(0, 0, 0, 0.3),
        0 0 30px rgba(255, 222, 0, 0.2);
      animation: logo-pulse 3s infinite ease-in-out;
    }

    @keyframes logo-pulse {
      0%, 100% { box-shadow: 0 8px 25px rgba(0,0,0,0.3), 0 0 20px rgba(255,222,0,0.2); }
      50% { box-shadow: 0 8px 25px rgba(0,0,0,0.3), 0 0 40px rgba(255,222,0,0.4); }
    }

    .escudo {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 12px;
    }

    .banner-text h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: white;
      letter-spacing: 0.5px;
    }

    .welcome-name {
      margin: 6px 0 0;
      font-size: 18px;
      color: var(--primary-yellow);
      font-weight: 600;
    }

    .welcome-date {
      display: inline-block;
      margin-top: 10px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      padding: 6px 14px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
    }

    .banner-decoration {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 200px;
      pointer-events: none;
    }

    .circle {
      position: absolute;
      border-radius: 50%;
      border: 2px solid rgba(255, 222, 0, 0.2);
    }

    .c1 { width: 100px; height: 100px; top: -30px; right: 20px; }
    .c2 { width: 60px; height: 60px; bottom: 10px; right: 80px; }
    .c3 { width: 40px; height: 40px; top: 50%; right: 10px; }

    /* === LOADING === */
    .loading {
      text-align: center;
      padding: 60px;
      color: #6b7280;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #e5e7eb;
      border-top-color: var(--primary-blue);
      border-radius: 50%;
      margin: 0 auto 16px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* === STATS GRID === */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      gap: 18px;
      transition: all 0.3s ease;
      border-left: 4px solid transparent;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    }

    .stat-icon {
      font-size: 36px;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      background: #f3f4f6;
    }

    .card-jugadores { border-left-color: #3b82f6; }
    .card-jugadores .stat-icon { background: #eff6ff; }

    .card-recaudado { border-left-color: #10b981; }
    .card-recaudado .stat-icon { background: #ecfdf5; }

    .card-pendientes { border-left-color: #f59e0b; }
    .card-pendientes .stat-icon { background: #fffbeb; }

    .card-vencidas { border-left-color: #ef4444; }
    .card-vencidas .stat-icon { background: #fef2f2; }

    .stat-info h3 {
      font-size: 13px;
      color: #6b7280;
      margin: 0 0 6px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-info .value {
      font-size: 32px;
      font-weight: 700;
      color: var(--primary-blue);
      margin: 0;
      line-height: 1.1;
    }

    .card-vencidas .stat-info .value {
      color: #ef4444;
    }

    .stat-info .subtitle {
      font-size: 13px;
      color: #9ca3af;
      margin: 4px 0 0;
    }

    /* === ACTIONS CARD === */
    .actions-card {
      background: white;
      padding: 28px;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    }

    .card-header {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: var(--primary-blue);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-icon {
      font-size: 22px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 20px;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 600;
    }

    .action-btn .btn-icon {
      font-size: 28px;
    }

    .action-btn .btn-label {
      font-size: 14px;
    }

    .btn-jugadores {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    .btn-jugadores:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
    }

    .btn-pagos {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .btn-pagos:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }

    .btn-mensualidades {
      background: linear-gradient(135deg, var(--primary-yellow) 0%, #ffc107 100%);
      color: var(--dark-blue);
    }

    .btn-mensualidades:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(255, 222, 0, 0.4);
    }

    .btn-reportes {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
    }

    .btn-reportes:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
    }

    /* === ALERT === */
    .alert-danger {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    /* === RESPONSIVE === */
    @media (max-width: 768px) {
      .content {
        padding: 16px;
      }

      .welcome-banner {
        padding: 20px;
      }

      .banner-content {
        flex-direction: column;
        text-align: center;
      }

      .banner-text h1 {
        font-size: 22px;
      }

      .banner-decoration {
        display: none;
      }

      .action-btn {
        padding: 16px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  stats: Estadisticas = {
    jugadores: { total: 0, activos: 0, inactivos: 0 },
    mes_actual: { recaudado: 0, total_pagos: 0 },
    mensualidades: { pendientes: 0, vencidas: 0 }
  };
  loading = true;
  error = '';

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.error = '';

    this.api.get<Estadisticas>('reportes/estadisticas-generales').subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se pudieron cargar las estadísticas';
        this.loading = false;
        console.error('Error loading stats:', err);
      }
    });
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-CO').format(num);
  }

  navigate(url: string) {
    this.router.navigate([url]);
  }

  canAccessPagos(): boolean {
    return this.authService.hasRole(['administrador', 'tesorero']);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
