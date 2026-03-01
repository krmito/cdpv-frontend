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

    .welcome-subtitle {
      margin: 6px 0 0;
      font-size: 16px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 400;
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

    /* === SKELETON STATS === */
    .skeleton-stats {
      margin-bottom: 28px;
    }
    .skeleton-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .skeleton-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .skeleton-line {
      height: 14px; border-radius: 6px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .skeleton-lg { width: 80px; height: 28px; }
    .skeleton-sm { width: 130px; }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

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

    /* === RESUMEN FINANCIERO === */
    .resumen-card {
      background: white;
      padding: 28px;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
      margin-bottom: 28px;
    }

    .resumen-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .progress-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .progress-label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .progress-percent {
      font-size: 20px;
      font-weight: 700;
      color: var(--primary-blue);
    }

    .progress-bar-container {
      width: 100%;
      height: 14px;
      background: #e5e7eb;
      border-radius: 7px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
      border-radius: 7px;
      transition: width 0.8s ease;
    }

    .progress-amounts {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #6b7280;
    }

    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }

    .resumen-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
    }

    .resumen-value {
      font-size: 24px;
      font-weight: 700;
    }

    .resumen-label {
      font-size: 13px;
      color: #6b7280;
    }

    .pendiente-color {
      color: #f59e0b;
    }

    .moroso-color {
      color: #ef4444;
    }

    /* === ACTIONS CARD === */
    .actions-card {
      background: white;
      padding: 28px;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
      margin-bottom: 28px;
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

    .actions-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Primary action */
    .action-btn-primary {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 100%;
      text-align: left;
    }

    .action-btn-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }

    .btn-icon-lg {
      font-size: 36px;
      flex-shrink: 0;
    }

    .btn-primary-text {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .btn-label-main {
      font-size: 18px;
      font-weight: 700;
    }

    .btn-label-sub {
      font-size: 13px;
      opacity: 0.8;
      margin-top: 2px;
    }

    .btn-arrow {
      font-size: 24px;
      opacity: 0.7;
      transition: transform 0.2s;
    }

    .action-btn-primary:hover .btn-arrow {
      transform: translateX(4px);
      opacity: 1;
    }

    /* Secondary actions */
    .actions-grid-secondary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .action-btn-sec {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
      color: #374151;
    }

    .action-btn-sec .btn-icon {
      font-size: 22px;
    }

    .action-btn-sec .btn-label {
      font-size: 14px;
    }

    .action-btn-sec:hover {
      background: #eef2ff;
      border-color: #c7d2fe;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    /* === ACTIVITY GRID === */
    .activity-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .activity-card {
      background: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    }

    .activity-loading {
      text-align: center;
      padding: 32px;
      color: #9ca3af;
      font-size: 14px;
    }

    .activity-empty {
      text-align: center;
      padding: 32px;
      color: #9ca3af;
      font-size: 14px;
    }

    .activity-ok {
      color: #10b981;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .ok-icon {
      font-size: 28px;
      width: 48px;
      height: 48px;
      background: #ecfdf5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 8px;
      border-radius: 10px;
      transition: background 0.2s;
    }

    .activity-item:hover {
      background: #f9fafb;
    }

    .activity-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }

    .activity-icon-pago {
      background: #ecfdf5;
    }

    .activity-icon-alert {
      background: #fef2f2;
    }

    .activity-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .activity-title {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .activity-detail {
      font-size: 12px;
      color: #6b7280;
    }

    .activity-detail-alert {
      color: #dc2626;
    }

    .activity-time {
      font-size: 12px;
      color: #9ca3af;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .badge-vencida {
      background: #fef2f2;
      color: #dc2626;
      padding: 3px 10px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .ver-todas-btn {
      display: block;
      width: 100%;
      padding: 10px;
      margin-top: 8px;
      background: none;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #6b7280;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .ver-todas-btn:hover {
      background: #f9fafb;
      color: #374151;
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

      .actions-grid-secondary {
        grid-template-columns: 1fr;
      }

      .activity-grid {
        grid-template-columns: 1fr;
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
