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
          <h1>Dashboard</h1>

          @if (loading) {
            <div class="loading">
              <p>Cargando estadísticas...</p>
            </div>
          } @else if (error) {
            <div class="alert alert-danger">
              <strong>Error:</strong> {{ error }}
              <br>
              <small>Verifica que el backend esté corriendo en http://localhost:3000</small>
            </div>
          } @else {
            <div class="stats-grid">
              <div class="stat-card">
                <h3>👥 Jugadores Activos</h3>
                <div class="value">{{ stats.jugadores?.activos || 0 }}</div>
                <p class="subtitle">de {{ stats.jugadores?.total || 0 }} totales</p>
              </div>

              <div class="stat-card">
                <h3>💰 Recaudado Este Mes</h3>
                <div class="value">\${{ formatNumber(stats.mes_actual?.recaudado || 0) }}</div>
                <p class="subtitle">{{ stats.mes_actual?.total_pagos || 0 }} pagos registrados</p>
              </div>

              <div class="stat-card">
                <h3>📋 Mensualidades Pendientes</h3>
                <div class="value">{{ stats.mensualidades?.pendientes || 0 }}</div>
                <p class="subtitle">Por cobrar</p>
              </div>

              <div class="stat-card alert-card">
                <h3>⚠️ Mensualidades Vencidas</h3>
                <div class="value danger">{{ stats.mensualidades?.vencidas || 0 }}</div>
                <p class="subtitle">Requieren atención</p>
              </div>
            </div>

            <div class="card">
              <div class="card-header">Acciones Rápidas</div>
              <div class="actions-grid">
                <button class="btn btn-primary" (click)="navigate('/jugadores')">
                  👥 Ver Jugadores
                </button>
                @if (canAccessPagos()) {
                  <button class="btn btn-success" (click)="navigate('/pagos')">
                    💰 Registrar Pago
                  </button>
                }
                <button class="btn btn-primary" (click)="navigate('/mensualidades')">
                  📅 Mensualidades
                </button>
                <button class="btn btn-primary" (click)="navigate('/reportes')">
                  📈 Ver Reportes
                </button>
              </div>
            </div>

            <div class="info-card">
              <h3>✅ Sistema Funcionando Correctamente</h3>
              <p>El frontend está conectado al backend en: <code>http://localhost:3000/api/v1</code></p>
              <p>Usuario: <strong>{{ authService.currentUser()?.nombre }}</strong></p>
              <p>Rol: <strong>{{ authService.currentUser()?.rol }}</strong></p>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
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
      padding: 32px;
      overflow-y: auto;
      background: #f5f7fa;
    }
    h1 {
      color: #111827;
      margin-bottom: 32px;
      font-size: 32px;
    }
    .loading {
      text-align: center;
      padding: 60px;
      color: #6b7280;
      font-size: 18px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: white;
      padding: 28px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .stat-card.alert-card {
      border-left: 4px solid #ef4444;
    }
    .stat-card h3 {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 12px 0;
      font-weight: 500;
    }
    .stat-card .value {
      font-size: 36px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
    .stat-card .value.danger {
      color: #ef4444;
    }
    .stat-card .subtitle {
      font-size: 13px;
      color: #9ca3af;
      margin: 8px 0 0 0;
    }
    .card {
      background: white;
      padding: 28px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 24px;
    }
    .card-header {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #111827;
    }
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .actions-grid .btn {
      padding: 14px 20px;
      font-size: 15px;
      justify-content: center;
      display: flex;
      align-items: center;
    }
    .info-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 28px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .info-card h3 {
      margin: 0 0 16px 0;
    }
    .info-card p {
      margin: 8px 0;
      opacity: 0.95;
    }
    .info-card code {
      background: rgba(255,255,255,0.2);
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
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
}
