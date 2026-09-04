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
                      @if (hijo.foto_url && !fotoErrorIds.has(hijo.id)) {
                        <img [src]="getFotoUrl(hijo.foto_url)" [alt]="hijo.nombre" class="avatar-foto" (error)="onFotoError(hijo.id)" />
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
  styleUrl: './mis-hijos.component.css'
})
export class MisHijosComponent implements OnInit {
  private acudienteService = inject(AcudienteService);
  private apiService = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = signal(true);
  hijos = signal<any[]>([]);
  fotoErrorIds = new Set<number>();

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

  onFotoError(id: number) {
    this.fotoErrorIds.add(id);
  }

  getInitials(nombre: string, apellido: string): string {
    return `${nombre?.charAt(0) ?? ''}${apellido?.charAt(0) ?? ''}`.toUpperCase();
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  }
}
