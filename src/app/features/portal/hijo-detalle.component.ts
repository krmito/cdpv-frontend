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
                @if (historial()!.jugador.foto_url && !fotoError()) {
                  <img [src]="getFotoUrl(historial()!.jugador.foto_url)" [alt]="historial()!.jugador.nombre" class="jugador-foto" (error)="fotoError.set(true)" />
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
  styleUrl: './hijo-detalle.component.css'
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
  fotoError = signal(false);

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
