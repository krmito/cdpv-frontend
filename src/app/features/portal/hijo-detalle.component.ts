import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { AcudienteService } from '../../core/services/acudiente.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiService } from '../../core/services/api.service';

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

@Component({
  selector: 'app-hijo-detalle',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  template: `
    <div class="layout">
      <app-navbar/>
      <div class="main-container">
        <app-sidebar/>
        <main class="content">
          <div class="page-top">
            <button class="btn-back" (click)="volver()">← Volver a Mis Hijos</button>
          </div>

          @if (loading()) {
            <div class="skeleton-header"></div>
            <div class="skeleton-tabs"></div>
          } @else if (historial()) {
            <!-- Card del jugador -->
            <div class="jugador-card">
              <div class="jugador-avatar-wrap">
                @if (historial()!.jugador.foto_url) {
                  <img [src]="getFotoUrl(historial()!.jugador.foto_url)" [alt]="historial()!.jugador.nombre" class="jugador-foto" />
                } @else {
                  <div class="jugador-avatar-placeholder">{{ getInitials() }}</div>
                }
              </div>
              <div class="jugador-info">
                <h2>{{ historial()!.jugador.nombre }} {{ historial()!.jugador.apellido }}</h2>
                <div class="jugador-meta">
                  <span class="meta-item">📋 {{ historial()!.jugador.tipo_documento }}: {{ historial()!.jugador.documento }}</span>
                  <span class="meta-item">📁 {{ historial()!.jugador.categoria?.nombre ?? 'Sin categoría' }}</span>
                </div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="tabs">
              <button class="tab-btn" [class.active]="activeTab() === 'mensualidades'" (click)="activeTab.set('mensualidades')">
                📅 Mensualidades
              </button>
              <button class="tab-btn" [class.active]="activeTab() === 'pagos'" (click)="activeTab.set('pagos')">
                💰 Historial de Pagos
              </button>
            </div>

            <!-- TAB Mensualidades -->
            @if (activeTab() === 'mensualidades') {
              <div class="card">
                @if (historial()!.mensualidades.length === 0) {
                  <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <h4>Sin mensualidades</h4>
                    <p>No hay mensualidades registradas para este jugador.</p>
                  </div>
                } @else {
                  <div class="table-responsive">
                    <table class="data-table">
                      <thead>
                        <tr>
                          <th>Período</th>
                          <th>Monto</th>
                          <th>Pagado</th>
                          <th>Saldo</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (m of historial()!.mensualidades; track m.id) {
                          <tr>
                            <td>{{ getMesPeriodo(m) }}</td>
                            <td>{{ formatMoney(m.monto) }}</td>
                            <td>{{ formatMoney(m.monto_pagado) }}</td>
                            <td>{{ formatMoney(m.saldo_pendiente) }}</td>
                            <td><span class="estado-badge" [class]="'estado-' + m.estado">{{ m.estado }}</span></td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            }

            <!-- TAB Historial de Pagos -->
            @if (activeTab() === 'pagos') {
              <div class="card">
                @if (historial()!.historial_pagos.length === 0) {
                  <div class="empty-state">
                    <div class="empty-icon">💰</div>
                    <h4>Sin pagos registrados</h4>
                    <p>No hay pagos registrados para este jugador.</p>
                  </div>
                } @else {
                  <div class="table-responsive">
                    <table class="data-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>N° Recibo</th>
                          <th>Período</th>
                          <th>Método</th>
                          <th>Monto</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (p of historial()!.historial_pagos; track p.id) {
                          <tr [class.anulado-row]="p.anulado">
                            <td>{{ formatDate(p.fecha_pago) }}</td>
                            <td><code class="recibo-code">{{ p.numero_recibo }}</code></td>
                            <td>{{ p.mensualidad ? getMesPeriodo(p.mensualidad) : '—' }}</td>
                            <td class="capitalize">{{ p.metodo_pago }}</td>
                            <td [class.anulado-text]="p.anulado">{{ formatMoney(p.monto_pagado) }}</td>
                            <td>
                              @if (p.anulado) {
                                <span class="estado-badge estado-anulado">Anulado</span>
                              } @else {
                                <span class="estado-badge estado-pagado">Pagado</span>
                              }
                            </td>
                            <td>
                              <div class="acciones-cell">
                                <button class="btn-accion btn-pdf"
                                  (click)="descargarRecibo(p.id)"
                                  [disabled]="descargando()[p.id + '_pdf']"
                                  title="Descargar recibo PDF">
                                  @if (descargando()[p.id + '_pdf']) { ⏳ } @else { 📄 } Recibo
                                </button>
                                @for (c of p.comprobantes; track c.id) {
                                  <button class="btn-accion btn-comprobante"
                                    (click)="descargarComprobante(p.id, c.id, c.nombre_archivo)"
                                    [disabled]="descargando()[p.id + '_c' + c.id]"
                                    title="{{ c.nombre_archivo }}">
                                    @if (descargando()[p.id + '_c' + c.id]) { ⏳ } @else { 📥 } Comprobante
                                  </button>
                                }
                              </div>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            }
          } @else {
            <div class="empty-state">
              <div class="empty-icon">⚠️</div>
              <h4>No se pudo cargar la información</h4>
              <p>Verifica tu conexión o contacta al administrador.</p>
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

    .page-top { margin-bottom: 20px; }
    .btn-back {
      background: none; border: 1.5px solid #e2e8f0; border-radius: 8px;
      padding: 8px 16px; font-size: 14px; color: #374151; cursor: pointer;
      transition: all 0.2s;
    }
    .btn-back:hover { background: #f1f5f9; border-color: var(--primary); color: var(--primary); }

    /* Jugador card */
    .jugador-card {
      background: white; border-radius: 14px; padding: 20px 24px;
      display: flex; align-items: center; gap: 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 20px;
    }
    .jugador-foto { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #e2e8f0; }
    .jugador-avatar-placeholder {
      width: 80px; height: 80px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, var(--primary), #2d4a6a);
      color: white; font-size: 28px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .jugador-info h2 { margin: 0 0 8px; font-size: 22px; color: #1e293b; }
    .jugador-meta { display: flex; flex-wrap: wrap; gap: 12px; }
    .meta-item { font-size: 14px; color: #6b7280; }

    /* Tabs */
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
    .tab-btn {
      padding: 10px 20px; border: none; background: none; cursor: pointer;
      font-size: 14px; font-weight: 500; color: #6b7280;
      border-bottom: 2px solid transparent; margin-bottom: -2px;
      transition: all 0.2s; border-radius: 6px 6px 0 0;
    }
    .tab-btn:hover { color: var(--primary); background: #f1f5f9; }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); background: transparent; }

    /* Card */
    .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

    /* Table */
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .data-table th { background: #f8fafc; padding: 12px 16px; text-align: left; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #374151; white-space: nowrap; }
    .data-table td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .data-table tr:hover td { background: #fafafa; }

    .anulado-row td { opacity: 0.55; }
    .anulado-text { text-decoration: line-through; }
    .capitalize { text-transform: capitalize; }

    .recibo-code { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-family: monospace; }

    /* Estado badges */
    .estado-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
    .estado-pagado { background: #dcfce7; color: #166534; }
    .estado-pendiente, .estado-parcial { background: #fef9c3; color: #854d0e; }
    .estado-vencido { background: #fee2e2; color: #991b1b; }
    .estado-anulado { background: #f1f5f9; color: #6b7280; }

    /* Acciones */
    .acciones-cell { display: flex; flex-wrap: wrap; gap: 4px; }
    .btn-accion {
      padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer;
      font-size: 12px; font-weight: 500; transition: all 0.2s;
    }
    .btn-accion:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-pdf { background: #dbeafe; color: #1e40af; }
    .btn-pdf:hover:not(:disabled) { background: #bfdbfe; }
    .btn-comprobante { background: #f0fdf4; color: #166534; }
    .btn-comprobante:hover:not(:disabled) { background: #dcfce7; }

    /* Empty */
    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty-state h4 { margin: 0 0 8px; font-size: 18px; color: #374151; }
    .empty-state p { margin: 0; color: #9ca3af; }

    /* Skeleton */
    .skeleton-header { background: #e2e8f0; border-radius: 14px; height: 120px; margin-bottom: 20px; animation: pulse 1.5s infinite; }
    .skeleton-tabs { background: #e2e8f0; border-radius: 8px; height: 44px; margin-bottom: 16px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    @media (max-width: 768px) {
      .content { padding: 16px; }
      .jugador-card { flex-direction: column; text-align: center; }
      .jugador-meta { justify-content: center; }
    }
  `]
})
export class HijoDetalleComponent implements OnInit {
  private acudienteService = inject(AcudienteService);
  private apiService = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(true);
  historial = signal<any>(null);
  activeTab = signal<'mensualidades' | 'pagos'>('mensualidades');
  descargando = signal<Record<string, boolean>>({});

  private jugadorId!: number;

  ngOnInit() {
    this.jugadorId = Number(this.route.snapshot.paramMap.get('jugadorId'));
    this.acudienteService.getHijoHistorial(this.jugadorId).subscribe({
      next: (data) => {
        this.historial.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar el historial del jugador');
        this.loading.set(false);
      }
    });
  }

  volver() {
    this.router.navigate(['/portal/mis-hijos']);
  }

  descargarRecibo(pagoId: number) {
    const key = `${pagoId}_pdf`;
    this.descargando.update(d => ({ ...d, [key]: true }));
    this.acudienteService.downloadReciboPdf(this.jugadorId, pagoId).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `recibo-${pagoId}.pdf`);
        this.descargando.update(d => ({ ...d, [key]: false }));
      },
      error: () => {
        this.toast.error('Error al descargar el recibo');
        this.descargando.update(d => ({ ...d, [key]: false }));
      }
    });
  }

  descargarComprobante(pagoId: number, comprobanteId: number, nombreArchivo: string) {
    const key = `${pagoId}_c${comprobanteId}`;
    this.descargando.update(d => ({ ...d, [key]: true }));
    this.acudienteService.downloadComprobante(this.jugadorId, pagoId, comprobanteId).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, nombreArchivo);
        this.descargando.update(d => ({ ...d, [key]: false }));
      },
      error: () => {
        this.toast.error('Error al descargar el comprobante');
        this.descargando.update(d => ({ ...d, [key]: false }));
      }
    });
  }

  private triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  getFotoUrl(fotoUrl: string): string {
    return `${this.apiService.getBaseUrl()}/${fotoUrl}`;
  }

  getInitials(): string {
    const j = this.historial()?.jugador;
    if (!j) return '?';
    return `${j.nombre?.charAt(0) ?? ''}${j.apellido?.charAt(0) ?? ''}`.toUpperCase();
  }

  getMesPeriodo(m: any): string {
    return `${MESES[m.mes] ?? m.mes} ${m.anio}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(value));
  }
}
