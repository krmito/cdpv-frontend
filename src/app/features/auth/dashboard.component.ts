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
  proyeccion?: {
    total_esperado: number;
    total_recaudado: number;
    total_pendiente: number;
    porcentaje_cumplimiento: number;
  };
  morosos?: {
    total_morosos: number;
    deuda_total: number;
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
                <img src="assets/escudo2.png" alt="Escudo" class="escudo" />
              </div>
              <div class="banner-text">
                <h1>{{ getGreeting() }}, {{ getFirstName() }}</h1>
                <p class="welcome-subtitle">Panel de control del club</p>
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
            <div class="stats-grid skeleton-stats" aria-busy="true" aria-label="Cargando estadísticas">
              @for (i of [1,2,3,4]; track i) {
                <div class="skeleton-card">
                  <div class="skeleton-icon"></div>
                  <div class="skeleton-line skeleton-lg"></div>
                  <div class="skeleton-line skeleton-sm"></div>
                </div>
              }
            </div>
          } @else if (error) {
            <div class="alert alert-danger" role="alert">
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

            <!-- Resumen Financiero del Mes -->
            @if (stats.proyeccion) {
              <div class="card resumen-card">
                <div class="card-header">
                  <span class="header-icon">📊</span>
                  Resumen del Mes
                </div>
                <div class="resumen-content">
                  <div class="progress-section">
                    <div class="progress-header">
                      <span class="progress-label">Recaudación</span>
                      <span class="progress-percent">{{ stats.proyeccion.porcentaje_cumplimiento | number:'1.0-0' }}%</span>
                    </div>
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill" [style.width.%]="stats.proyeccion.porcentaje_cumplimiento > 100 ? 100 : stats.proyeccion.porcentaje_cumplimiento"></div>
                    </div>
                    <div class="progress-amounts">
                      <span>\${{ formatNumber(stats.proyeccion.total_recaudado) }} recaudado</span>
                      <span>de \${{ formatNumber(stats.proyeccion.total_esperado) }}</span>
                    </div>
                  </div>
                  <div class="resumen-grid">
                    <div class="resumen-item">
                      <span class="resumen-value pendiente-color">\${{ formatNumber(stats.proyeccion.total_pendiente) }}</span>
                      <span class="resumen-label">Pendiente por cobrar</span>
                    </div>
                    @if (stats.morosos) {
                      <div class="resumen-item">
                        <span class="resumen-value moroso-color">{{ stats.morosos.total_morosos }}</span>
                        <span class="resumen-label">Jugadores morosos</span>
                      </div>
                      <div class="resumen-item">
                        <span class="resumen-value moroso-color">\${{ formatNumber(stats.morosos.deuda_total) }}</span>
                        <span class="resumen-label">Deuda total acumulada</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }

            <div class="card actions-card">
              <div class="card-header">
                <span class="header-icon">⚡</span>
                Acciones Rápidas
              </div>
              <div class="actions-section">
                @if (canAccessPagos()) {
                  <button class="action-btn-primary" (click)="navigate('/pagos')">
                    <span class="btn-icon-lg">💰</span>
                    <div class="btn-primary-text">
                      <span class="btn-label-main">Registrar Pago</span>
                      <span class="btn-label-sub">Registrar un nuevo pago de mensualidad</span>
                    </div>
                    <span class="btn-arrow">→</span>
                  </button>
                }
                <div class="actions-grid-secondary">
                  <button class="action-btn-sec" (click)="navigate('/jugadores')">
                    <span class="btn-icon">👥</span>
                    <span class="btn-label">Jugadores</span>
                  </button>
                  <button class="action-btn-sec" (click)="navigate('/mensualidades')">
                    <span class="btn-icon">📅</span>
                    <span class="btn-label">Mensualidades</span>
                  </button>
                  <button class="action-btn-sec" (click)="navigate('/reportes')">
                    <span class="btn-icon">📈</span>
                    <span class="btn-label">Reportes</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Actividad Reciente -->
            <div class="activity-grid">
              <!-- Últimos pagos -->
              <div class="card activity-card">
                <div class="card-header">
                  <span class="header-icon">💰</span>
                  Últimos Pagos
                </div>
                @if (loadingActivity) {
                  <div class="activity-loading">Cargando...</div>
                } @else if (ultimosPagos.length === 0) {
                  <div class="activity-empty">No hay pagos recientes</div>
                } @else {
                  <div class="activity-list">
                    @for (pago of ultimosPagos; track pago.id) {
                      <div class="activity-item">
                        <div class="activity-icon activity-icon-pago">💰</div>
                        <div class="activity-info">
                          <span class="activity-title">{{ pago.jugador?.nombre }} {{ pago.jugador?.apellido }}</span>
                          <span class="activity-detail">
                            \${{ formatNumber(pago.monto_pagado) }} - {{ pago.metodo_pago }}
                          </span>
                        </div>
                        <span class="activity-time">{{ getTimeAgo(pago.fecha_pago) }}</span>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Alertas -->
              <div class="card activity-card">
                <div class="card-header">
                  <span class="header-icon">⚠️</span>
                  Alertas
                </div>
                @if (loadingActivity) {
                  <div class="activity-loading">Cargando...</div>
                } @else if (alertas.length === 0) {
                  <div class="activity-empty activity-ok">
                    <span class="ok-icon">✓</span>
                    Todo al día, sin alertas pendientes
                  </div>
                } @else {
                  <div class="activity-list">
                    @for (alerta of alertas; track alerta.id) {
                      <div class="activity-item activity-item-alert">
                        <div class="activity-icon activity-icon-alert">⚠️</div>
                        <div class="activity-info">
                          <span class="activity-title">{{ alerta.jugador?.nombre }} {{ alerta.jugador?.apellido }}</span>
                          <span class="activity-detail activity-detail-alert">
                            {{ getMesNombre(alerta.mes) }} {{ alerta.anio }} - Saldo: \${{ formatNumber(alerta.saldo_pendiente) }}
                          </span>
                        </div>
                        <span class="badge-vencida">Vencida</span>
                      </div>
                    }
                  </div>
                  @if (totalVencidas > 5) {
                    <button class="ver-todas-btn" (click)="navigate('/mensualidades')">
                      Ver todas ({{ totalVencidas }}) →
                    </button>
                  }
                }
              </div>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styleUrl: './dashboard.component.css'
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

  // Actividad reciente
  ultimosPagos: any[] = [];
  alertas: any[] = [];
  totalVencidas = 0;
  loadingActivity = true;

  ngOnInit() {
    this.loadStats();
    this.loadActivity();
  }

  loadStats() {
    this.loading = true;
    this.error = '';

    this.api.get<Estadisticas>('reportes/estadisticas-generales').subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.loadFinancialSummary();
      },
      error: (err) => {
        this.error = 'No se pudieron cargar las estadísticas';
        this.loading = false;
        console.error('Error loading stats:', err);
      }
    });
  }

  loadFinancialSummary() {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    this.api.get<any>(`reportes/proyeccion-ingresos?mes=${mes}&anio=${anio}`).subscribe({
      next: (data) => {
        this.stats.proyeccion = data;
      },
      error: () => {}
    });

    this.api.get<any>('reportes/morosos').subscribe({
      next: (data) => {
        this.stats.morosos = data;
      },
      error: () => {}
    });
  }

  loadActivity() {
    this.loadingActivity = true;

    // Cargar últimos pagos
    this.api.get<any>('pagos?page=1&limit=5&sortBy=fecha_pago&sortOrder=DESC').subscribe({
      next: (response) => {
        this.ultimosPagos = response.data || [];
        this.checkActivityLoaded();
      },
      error: () => {
        this.ultimosPagos = [];
        this.checkActivityLoaded();
      }
    });

    // Cargar mensualidades vencidas
    this.api.get<any[]>('mensualidades/vencidas').subscribe({
      next: (data) => {
        this.totalVencidas = data.length;
        this.alertas = data.slice(0, 5);
        this.checkActivityLoaded();
      },
      error: () => {
        this.alertas = [];
        this.checkActivityLoaded();
      }
    });
  }

  private activityLoadCount = 0;
  private checkActivityLoaded() {
    this.activityLoadCount++;
    if (this.activityLoadCount >= 2) {
      this.loadingActivity = false;
    }
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

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getFirstName(): string {
    const nombre = this.authService.currentUser()?.nombre || '';
    return nombre.split(' ')[0];
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `hace ${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Ayer';
    if (diffD < 7) return `hace ${diffD}d`;
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  }

  getMesNombre(mes: number): string {
    const meses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[mes] || `Mes ${mes}`;
  }
}
