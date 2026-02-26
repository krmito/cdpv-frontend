import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AcudienteService } from '../../core/services/acudiente.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-mis-hijos',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent, PageHeaderComponent],
  template: `
    <div class="layout">
      <app-navbar/>
      <div class="main-container">
        <app-sidebar/>
        <main class="content">
          <app-page-header
            title="Mis Hijos"
            subtitle="Seguimiento de mensualidades y pagos"
            icon="👨‍👧‍👦"
          />

          @if (loading()) {
            <div class="cards-grid" aria-busy="true" aria-label="Cargando hijos">
              @for (i of [1,2,3]; track i) {
                <div class="card skeleton-card">
                  <div class="skeleton skeleton-avatar-lg"></div>
                  <div class="skeleton skeleton-text lg"></div>
                  <div class="skeleton skeleton-text md"></div>
                  <div class="skeleton skeleton-pills"></div>
                </div>
              }
            </div>
          } @else if (hijos().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">👶</div>
              <h4>No tienes hijos vinculados</h4>
              <p>Contacta al administrador para vincular tus hijos al sistema.</p>
            </div>
          } @else {
            <div class="cards-grid">
              @for (hijo of hijos(); track hijo.id) {
                <div class="hijo-card">
                  <div class="card-header">
                    <div class="avatar-container">
                      @if (hijo.foto_url) {
                        <img [src]="getFotoUrl(hijo.foto_url)" [alt]="hijo.nombre" class="avatar-foto" />
                      } @else {
                        <div class="avatar-placeholder">{{ getInitials(hijo.nombre, hijo.apellido) }}</div>
                      }
                    </div>
                    <div class="card-info">
                      <h3 class="hijo-nombre">{{ hijo.nombre }} {{ hijo.apellido }}</h3>
                      <span class="categoria-badge">{{ hijo.categoria?.nombre ?? 'Sin categoría' }}</span>
                      <span class="doc-text">Doc: {{ hijo.documento }}</span>
                    </div>
                  </div>

                  <div class="resumen-pills">
                    @if (hijo.resumen.al_dia > 0) {
                      <span class="pill pill-success">✓ {{ hijo.resumen.al_dia }} al día</span>
                    }
                    @if (hijo.resumen.pendientes > 0) {
                      <span class="pill pill-warning">⏳ {{ hijo.resumen.pendientes }} pendiente{{ hijo.resumen.pendientes !== 1 ? 's' : '' }}</span>
                    }
                    @if (hijo.resumen.vencidas > 0) {
                      <span class="pill pill-danger">⚠ {{ hijo.resumen.vencidas }} vencida{{ hijo.resumen.vencidas !== 1 ? 's' : '' }}</span>
                    }
                    @if (hijo.resumen.pendientes === 0 && hijo.resumen.vencidas === 0 && hijo.resumen.al_dia === 0) {
                      <span class="pill pill-neutral">Sin mensualidades</span>
                    }
                  </div>

                  @if (hijo.resumen.saldo_pendiente > 0) {
                    <div class="saldo-row">
                      <span class="saldo-label">Saldo pendiente:</span>
                      <span class="saldo-monto">{{ formatMoney(hijo.resumen.saldo_pendiente) }}</span>
                    </div>
                  }

                  <button class="btn-detalle" (click)="verDetalle(hijo.id)">
                    Ver Detalle →
                  </button>
                </div>
              }
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { --primary: #1a3a5c; --yellow: #ffde00; }

    .layout { display: flex; flex-direction: column; min-height: 100vh; }
    .main-container { display: flex; flex: 1; overflow: hidden; }
    .content { flex: 1; padding: 24px; overflow-y: auto; background: #f8fafc; }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    /* Hijo Card */
    .hijo-card {
      background: #fff;
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: box-shadow 0.2s;
    }
    .hijo-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }

    .card-header { display: flex; align-items: center; gap: 14px; }
    .avatar-container { flex-shrink: 0; }
    .avatar-foto { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0; }
    .avatar-placeholder {
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), #2d4a6a);
      color: white; font-size: 22px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .card-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .hijo-nombre { margin: 0; font-size: 16px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .categoria-badge { background: #e0e7ff; color: #3730a3; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; width: fit-content; }
    .doc-text { font-size: 12px; color: #94a3b8; }

    /* Pills */
    .resumen-pills { display: flex; flex-wrap: wrap; gap: 6px; }
    .pill { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .pill-success { background: #dcfce7; color: #166534; }
    .pill-warning { background: #fef9c3; color: #854d0e; }
    .pill-danger { background: #fee2e2; color: #991b1b; }
    .pill-neutral { background: #f1f5f9; color: #64748b; }

    /* Saldo */
    .saldo-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #fef2f2; border-radius: 8px; }
    .saldo-label { font-size: 13px; color: #6b7280; }
    .saldo-monto { font-size: 15px; font-weight: 700; color: #991b1b; }

    /* Botón */
    .btn-detalle {
      width: 100%; padding: 10px; border: none; border-radius: 10px;
      background: var(--primary); color: white;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: background 0.2s; margin-top: auto;
    }
    .btn-detalle:hover { background: #0d2740; }

    /* Empty State */
    .empty-state { text-align: center; padding: 80px 20px; }
    .empty-icon { font-size: 64px; margin-bottom: 16px; }
    .empty-state h4 { margin: 0 0 8px; font-size: 20px; color: #374151; }
    .empty-state p { margin: 0; color: #9ca3af; font-size: 15px; }

    /* Skeleton */
    .skeleton-card { min-height: 220px; }
    .skeleton { background: #e2e8f0; border-radius: 6px; animation: pulse 1.5s infinite; }
    .skeleton-avatar-lg { width: 60px; height: 60px; border-radius: 50%; margin-bottom: 12px; }
    .skeleton-text.lg { width: 70%; height: 18px; margin-bottom: 10px; }
    .skeleton-text.md { width: 50%; height: 14px; margin-bottom: 16px; }
    .skeleton-pills { width: 80%; height: 24px; border-radius: 20px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    @media (max-width: 768px) {
      .content { padding: 16px; }
      .cards-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class MisHijosComponent implements OnInit {
  private acudienteService = inject(AcudienteService);
  private apiService = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = signal(true);
  hijos = signal<any[]>([]);

  ngOnInit() {
    this.acudienteService.getMisHijos().subscribe({
      next: (data) => {
        this.hijos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los hijos vinculados');
        this.loading.set(false);
      }
    });
  }

  verDetalle(jugadorId: number) {
    this.router.navigate(['/portal/hijos', jugadorId]);
  }

  getFotoUrl(fotoUrl: string): string {
    return `${this.apiService.getBaseUrl()}/${fotoUrl}`;
  }

  getInitials(nombre: string, apellido: string): string {
    return `${nombre?.charAt(0) ?? ''}${apellido?.charAt(0) ?? ''}`.toUpperCase();
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  }
}
