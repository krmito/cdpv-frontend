import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, Chart, registerables } from 'chart.js';
import * as XLSX from 'xlsx';

// Register Chart.js components
Chart.register(...registerables);
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

interface EstadisticasGenerales {
  jugadores: { total: number; activos: number; inactivos: number };
  mes_actual: { recaudado: number; total_pagos: number };
  mensualidades: { pendientes: number; vencidas: number };
}

interface ReporteCaja {
  periodo: { desde: string; hasta: string };
  total_pagos: number;
  total_recaudado: number;
  agrupado: Record<string, { pagos: any[]; total: number }>;
}

interface Moroso {
  jugador: {
    id: number;
    nombre: string;
    apellido: string;
    documento: string;
    telefono: string;
    categoria?: { nombre: string };
  };
  mensualidades_vencidas: any[];
  total_deuda: number;
}

interface ReporteMorosos {
  total_morosos: number;
  deuda_total: number;
  morosos: Moroso[];
}

interface ProyeccionIngresos {
  mes: number;
  anio: number;
  total_esperado: number;
  total_recaudado: number;
  total_pendiente: number;
  porcentaje_cumplimiento: number;
  mensualidades: { total: number; pagadas: number; pendientes: number; vencidas: number };
}

interface CumplimientoCategoria {
  categoria: string;
  total_mensualidades: number;
  pagadas: number;
  pendientes: number;
  vencidas: number;
  esperado: number;
  recaudado: number;
  porcentaje_cumplimiento: number;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent, PageHeaderComponent, NgChartsModule],
  template: `
    <div class="layout">
      <app-navbar/>
      <div class="main-container">
        <app-sidebar/>
        <main class="content">
          <app-page-header
            title="Reportes y Estadísticas"
            subtitle="Analiza el rendimiento financiero del club"
            icon="📈"
          />

          <!-- Tabs -->
          <div class="tabs">
            <button class="tab" [class.active]="activeTab === 'dashboard'" (click)="changeTab('dashboard')">
              📊 Dashboard
            </button>
            <button class="tab" [class.active]="activeTab === 'caja'" (click)="changeTab('caja')">
              💰 Reporte de Caja
            </button>
            <button class="tab" [class.active]="activeTab === 'morosos'" (click)="changeTab('morosos')">
              ⚠️ Morosos
            </button>
            <button class="tab" [class.active]="activeTab === 'proyeccion'" (click)="changeTab('proyeccion')">
              📅 Proyección
            </button>
            <button class="tab" [class.active]="activeTab === 'categorias'" (click)="changeTab('categorias')">
              🏷️ Por Categoría
            </button>
          </div>

          <!-- TAB: DASHBOARD -->
          @if (activeTab === 'dashboard') {
            <div class="tab-content">
              @if (loadingStats) {
                <div class="loading">Cargando estadísticas...</div>
              } @else {
                <!-- KPIs -->
                <div class="kpi-grid">
                  <div class="kpi-card blue">
                    <div class="kpi-icon">👥</div>
                    <div class="kpi-content">
                      <span class="kpi-value">{{ estadisticas?.jugadores?.activos || 0 }}</span>
                      <span class="kpi-label">Jugadores Activos</span>
                    </div>
                  </div>
                  <div class="kpi-card green">
                    <div class="kpi-icon">💰</div>
                    <div class="kpi-content">
                      <span class="kpi-value">\${{ formatNumber(estadisticas?.mes_actual?.recaudado || 0) }}</span>
                      <span class="kpi-label">Recaudado este Mes</span>
                    </div>
                  </div>
                  <div class="kpi-card yellow">
                    <div class="kpi-icon">⏳</div>
                    <div class="kpi-content">
                      <span class="kpi-value">{{ estadisticas?.mensualidades?.pendientes || 0 }}</span>
                      <span class="kpi-label">Mensualidades Pendientes</span>
                    </div>
                  </div>
                  <div class="kpi-card red">
                    <div class="kpi-icon">⚠️</div>
                    <div class="kpi-content">
                      <span class="kpi-value">{{ estadisticas?.mensualidades?.vencidas || 0 }}</span>
                      <span class="kpi-label">Mensualidades Vencidas</span>
                    </div>
                  </div>
                </div>

                <!-- Resumen -->
                <div class="cards-row">
                  <div class="card">
                    <h3>Resumen de Jugadores</h3>
                    <div class="stat-list">
                      <div class="stat-item">
                        <span>Total registrados</span>
                        <strong>{{ estadisticas?.jugadores?.total || 0 }}</strong>
                      </div>
                      <div class="stat-item">
                        <span>Activos</span>
                        <strong class="text-green">{{ estadisticas?.jugadores?.activos || 0 }}</strong>
                      </div>
                      <div class="stat-item">
                        <span>Inactivos</span>
                        <strong class="text-red">{{ estadisticas?.jugadores?.inactivos || 0 }}</strong>
                      </div>
                    </div>
                  </div>
                  <div class="card">
                    <h3>Mensualidades del Mes</h3>
                    <div class="stat-list">
                      <div class="stat-item">
                        <span>Mensualidades pagadas</span>
                        <strong>{{ estadisticas?.mes_actual?.total_pagos || 0 }}</strong>
                      </div>
                      <div class="stat-item">
                        <span>Monto recaudado</span>
                        <strong class="text-green">\${{ formatNumber(estadisticas?.mes_actual?.recaudado || 0) }}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- TAB: REPORTE DE CAJA -->
          @if (activeTab === 'caja') {
            <div class="tab-content">
              <div class="card">
                <div class="card-header">
                  <h3>💰 Reporte de Caja</h3>
                  <div class="filters-inline">
                    <input type="date" class="form-control" [(ngModel)]="filtrosCaja.desde" />
                    <input type="date" class="form-control" [(ngModel)]="filtrosCaja.hasta" />
                    <button class="btn btn-primary" (click)="cargarReporteCaja()">Consultar</button>
                  </div>
                </div>

                @if (loadingCaja) {
                  <div class="loading">Cargando reporte...</div>
                } @else if (reporteCaja) {
                  <div class="caja-resumen">
                    <div class="resumen-item">
                      <span class="label">Período</span>
                      <span class="value">{{ reporteCaja.periodo.desde }} al {{ reporteCaja.periodo.hasta }}</span>
                    </div>
                    <div class="resumen-item">
                      <span class="label">Total de Pagos</span>
                      <span class="value">{{ reporteCaja.total_pagos }}</span>
                    </div>
                    <div class="resumen-item highlight">
                      <span class="label">Total Recaudado</span>
                      <span class="value">\${{ formatNumber(reporteCaja.total_recaudado) }}</span>
                    </div>
                  </div>

                  @if (cajaChartData.datasets[0].data.length > 0) {
                    <div class="chart-container" role="img" aria-label="Gráfico de barras de recaudación por fecha">
                      <canvas baseChart
                        [data]="cajaChartData"
                        [type]="'bar'"
                        [options]="barChartOptions">
                      </canvas>
                    </div>
                  }

                  <div class="table-container">
                    <table class="data-table">
                      <caption>Detalle de pagos agrupados por fecha</caption>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Cantidad</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of cajaItems; track item.fecha) {
                          <tr>
                            <td>{{ item.fecha }}</td>
                            <td>{{ item.cantidad }}</td>
                            <td class="monto">\${{ formatNumber(item.total) }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>
          }

          <!-- TAB: MOROSOS -->
          @if (activeTab === 'morosos') {
            <div class="tab-content">
              <div class="card">
                <div class="card-header">
                  <h3>⚠️ Listado de Morosos</h3>
                  <button class="btn btn-secondary" (click)="exportarMorosos()" [disabled]="!reporteMorosos">📥 Exportar XLSX</button>
                </div>

                <!-- Filtros -->
                <div class="filters-inline" style="margin-bottom: 20px;">
                  <select class="form-control" [(ngModel)]="filtrosMorosos.mes">
                    <option [ngValue]="null">Todos los meses</option>
                    @for (m of meses; track m.value) {
                      <option [ngValue]="m.value">{{ m.label }}</option>
                    }
                  </select>
                  <select class="form-control" [(ngModel)]="filtrosMorosos.anio">
                    <option [ngValue]="null">Todos los años</option>
                    @for (a of anios; track a) {
                      <option [ngValue]="a">{{ a }}</option>
                    }
                  </select>
                  <select class="form-control" [(ngModel)]="filtrosMorosos.categoriaId">
                    <option [ngValue]="null">Todas las categorías</option>
                    @for (cat of categorias; track cat.id) {
                      <option [ngValue]="cat.id">{{ cat.nombre }}</option>
                    }
                  </select>
                  <button class="btn btn-primary" (click)="cargarMorosos()">Consultar</button>
                  <button class="btn btn-outline" (click)="limpiarFiltrosMorosos()">Limpiar</button>
                </div>

                @if (loadingMorosos) {
                  <div class="loading">Cargando morosos...</div>
                } @else if (reporteMorosos) {
                  <div class="morosos-resumen">
                    <div class="resumen-item red">
                      <span class="label">Total Morosos</span>
                      <span class="value">{{ reporteMorosos.total_morosos }}</span>
                    </div>
                    <div class="resumen-item red">
                      <span class="label">Deuda Total</span>
                      <span class="value">\${{ formatNumber(reporteMorosos.deuda_total) }}</span>
                    </div>
                  </div>

                  @if ((reporteMorosos.morosos?.length ?? 0) === 0) {
                    <div class="empty-state success">
                      <p>🎉 No hay jugadores morosos</p>
                      <small>Todos los pagos están al día</small>
                    </div>
                  } @else {
                    <div class="table-container">
                      <table class="data-table">
                        <caption>Listado de jugadores con mensualidades vencidas</caption>
                        <thead>
                          <tr>
                            <th>Jugador</th>
                            <th>Documento</th>
                            <th>Teléfono</th>
                            <th>Categoría</th>
                            <th>Meses Vencidos</th>
                            <th>Deuda Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (moroso of (reporteMorosos.morosos ?? []); track $index) {
                            <tr>
                              <td><strong>{{ moroso.jugador?.nombre }} {{ moroso.jugador?.apellido }}</strong></td>
                              <td>{{ moroso.jugador?.documento }}</td>
                              <td>{{ moroso.jugador?.telefono }}</td>
                              <td>{{ moroso.jugador?.categoria?.nombre || 'N/A' }}</td>
                              <td>
                                <div class="meses-cell">
                                  @for (mv of (moroso.mensualidades_vencidas ?? []); track $index) {
                                    <span class="mes-badge">{{ getMesNombre(mv.mes) }} {{ mv.anio }}</span>
                                  }
                                  <span class="meses-count">({{ moroso.mensualidades_vencidas?.length ?? 0 }})</span>
                                </div>
                              </td>
                              <td class="monto red">\${{ formatNumber(moroso.total_deuda) }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                }
              </div>
            </div>
          }

          <!-- TAB: PROYECCIÓN -->
          @if (activeTab === 'proyeccion') {
            <div class="tab-content">
              <div class="card">
                <div class="card-header">
                  <h3>📅 Proyección de Ingresos</h3>
                  <div class="filters-inline">
                    <select class="form-control" [(ngModel)]="filtrosProyeccion.mes">
                      @for (m of meses; track m.value) {
                        <option [value]="m.value">{{ m.label }}</option>
                      }
                    </select>
                    <select class="form-control" [(ngModel)]="filtrosProyeccion.anio">
                      @for (a of anios; track a) {
                        <option [value]="a">{{ a }}</option>
                      }
                    </select>
                    <button class="btn btn-primary" (click)="cargarProyeccion()">Consultar</button>
                  </div>
                </div>

                @if (loadingProyeccion) {
                  <div class="loading">Cargando proyección...</div>
                } @else if (proyeccion) {
                  <div class="proyeccion-grid">
                    <div class="proyeccion-card">
                      <span class="label">Total Esperado</span>
                      <span class="value">\${{ formatNumber(proyeccion.total_esperado) }}</span>
                    </div>
                    <div class="proyeccion-card green">
                      <span class="label">Total Recaudado</span>
                      <span class="value">\${{ formatNumber(proyeccion.total_recaudado) }}</span>
                    </div>
                    <div class="proyeccion-card yellow">
                      <span class="label">Pendiente</span>
                      <span class="value">\${{ formatNumber(proyeccion.total_pendiente) }}</span>
                    </div>
                    <div class="proyeccion-card blue">
                      <span class="label">Cumplimiento</span>
                      <span class="value">{{ proyeccion.porcentaje_cumplimiento.toFixed(1) }}%</span>
                    </div>
                  </div>

                  <div class="chart-container" role="img" aria-label="Gráfico de dona con proyección de ingresos: recaudado vs pendiente">
                    <canvas baseChart
                      [data]="proyeccionChartData"
                      [type]="'doughnut'"
                      [options]="doughnutChartOptions">
                    </canvas>
                  </div>

                  <div class="mensualidades-stats">
                    <h4>Desglose de Mensualidades</h4>
                    <div class="stats-bar">
                      <div class="stat-segment green" [style.width.%]="getPercent(proyeccion.mensualidades.pagadas, proyeccion.mensualidades.total)">
                        {{ proyeccion.mensualidades.pagadas }} Pagadas
                      </div>
                      <div class="stat-segment yellow" [style.width.%]="getPercent(proyeccion.mensualidades.pendientes, proyeccion.mensualidades.total)">
                        {{ proyeccion.mensualidades.pendientes }} Pendientes
                      </div>
                      <div class="stat-segment red" [style.width.%]="getPercent(proyeccion.mensualidades.vencidas, proyeccion.mensualidades.total)">
                        {{ proyeccion.mensualidades.vencidas }} Vencidas
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- TAB: CUMPLIMIENTO POR CATEGORÍA -->
          @if (activeTab === 'categorias') {
            <div class="tab-content">
              <div class="card">
                <div class="card-header">
                  <h3>🏷️ Cumplimiento por Categoría</h3>
                  <div class="filters-inline">
                    <select class="form-control" [(ngModel)]="filtrosCategorias.mes">
                      @for (m of meses; track m.value) {
                        <option [value]="m.value">{{ m.label }}</option>
                      }
                    </select>
                    <select class="form-control" [(ngModel)]="filtrosCategorias.anio">
                      @for (a of anios; track a) {
                        <option [value]="a">{{ a }}</option>
                      }
                    </select>
                    <button class="btn btn-primary" (click)="cargarCumplimiento()">Consultar</button>
                  </div>
                </div>

                @if (loadingCategorias) {
                  <div class="loading">Cargando cumplimiento...</div>
                } @else if (cumplimientoCategorias.length > 0) {
                  <div class="chart-container" role="img" aria-label="Gráfico de barras de cumplimiento de pago por categoría">
                    <canvas baseChart
                      [data]="categoriasChartData"
                      [type]="'bar'"
                      [options]="categoriasChartOptions">
                    </canvas>
                  </div>

                  <div class="table-container">
                    <table class="data-table">
                      <caption>Cumplimiento de mensualidades por categoría</caption>
                      <thead>
                        <tr>
                          <th>Categoría</th>
                          <th>Total</th>
                          <th>Pagadas</th>
                          <th>Pendientes</th>
                          <th>Vencidas</th>
                          <th>Esperado</th>
                          <th>Recaudado</th>
                          <th>Cumplimiento</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (cat of cumplimientoCategorias; track cat.categoria) {
                          <tr>
                            <td><strong>{{ cat.categoria }}</strong></td>
                            <td>{{ cat.total_mensualidades }}</td>
                            <td class="text-green">{{ cat.pagadas }}</td>
                            <td class="text-yellow">{{ cat.pendientes }}</td>
                            <td class="text-red">{{ cat.vencidas }}</td>
                            <td>\${{ formatNumber(cat.esperado) }}</td>
                            <td class="monto">\${{ formatNumber(cat.recaudado) }}</td>
                            <td>
                              <span class="progress-badge" [class]="getProgressClass(cat.porcentaje_cumplimiento)">
                                {{ cat.porcentaje_cumplimiento.toFixed(1) }}%
                              </span>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  private api = inject(ApiService);

  activeTab: 'dashboard' | 'caja' | 'morosos' | 'proyeccion' | 'categorias' = 'dashboard';

  // Dashboard
  estadisticas: EstadisticasGenerales | null = null;
  loadingStats = false;

  // Reporte de Caja
  reporteCaja: ReporteCaja | null = null;
  loadingCaja = false;
  filtrosCaja = {
    desde: this.getFirstDayOfMonth(),
    hasta: this.getToday()
  };
  cajaItems: { fecha: string; cantidad: number; total: number }[] = [];

  // Morosos
  reporteMorosos: ReporteMorosos | null = null;
  loadingMorosos = false;
  filtrosMorosos: { mes: number | null; anio: number | null; categoriaId: number | null } = { mes: null, anio: null, categoriaId: null };
  categorias: { id: number; nombre: string }[] = [];

  // Proyección
  proyeccion: ProyeccionIngresos | null = null;
  loadingProyeccion = false;
  filtrosProyeccion = {
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear()
  };

  // Cumplimiento por categoría
  cumplimientoCategorias: CumplimientoCategoria[] = [];
  loadingCategorias = false;
  filtrosCategorias = {
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear()
  };

  // Opciones de filtros
  meses = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];
  anios = [2024, 2025, 2026, 2027];

  // Chart configurations
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: false } }
  };

  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };

  categoriasChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } }
  };

  cajaChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Recaudado', backgroundColor: '#4f46e5', borderRadius: 4 }]
  };

  proyeccionChartData: ChartData<'doughnut'> = {
    labels: ['Recaudado', 'Pendiente'],
    datasets: [{ data: [0, 0], backgroundColor: ['#10b981', '#ef4444'] }]
  };

  categoriasChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Esperado', backgroundColor: '#94a3b8', borderRadius: 4 },
      { data: [], label: 'Recaudado', backgroundColor: '#10b981', borderRadius: 4 }
    ]
  };

  ngOnInit() {
    this.cargarEstadisticas();
  }

  changeTab(tab: 'dashboard' | 'caja' | 'morosos' | 'proyeccion' | 'categorias') {
    this.activeTab = tab;
    if (tab === 'dashboard' && !this.estadisticas) this.cargarEstadisticas();
    if (tab === 'caja' && !this.reporteCaja) this.cargarReporteCaja();
    if (tab === 'morosos') {
      if (!this.reporteMorosos) this.cargarMorosos();
      if (this.categorias.length === 0) this.cargarCategoriasDropdown();
    }
    if (tab === 'proyeccion' && !this.proyeccion) this.cargarProyeccion();
    if (tab === 'categorias' && this.cumplimientoCategorias.length === 0) this.cargarCumplimiento();
  }

  cargarEstadisticas() {
    this.loadingStats = true;
    this.api.get<EstadisticasGenerales>('reportes/estadisticas-generales').subscribe({
      next: (data) => {
        this.estadisticas = data;
        this.loadingStats = false;
      },
      error: () => this.loadingStats = false
    });
  }

  cargarReporteCaja() {
    this.loadingCaja = true;
    const params = `fechaInicio=${this.filtrosCaja.desde}&fechaFin=${this.filtrosCaja.hasta}`;
    this.api.get<ReporteCaja>(`reportes/caja?${params}`).subscribe({
      next: (data) => {
        this.reporteCaja = data;
        this.procesarDatosCaja(data);
        this.loadingCaja = false;
      },
      error: () => this.loadingCaja = false
    });
  }

  procesarDatosCaja(data: ReporteCaja) {
    const items: { fecha: string; cantidad: number; total: number }[] = [];
    const labels: string[] = [];
    const values: number[] = [];

    for (const [fecha, info] of Object.entries(data.agrupado)) {
      items.push({ fecha, cantidad: info.pagos.length, total: info.total });
      labels.push(fecha);
      values.push(info.total);
    }

    this.cajaItems = items;
    this.cajaChartData = {
      labels,
      datasets: [{ data: values, label: 'Recaudado', backgroundColor: '#4f46e5', borderRadius: 4 }]
    };
  }

  cargarMorosos() {
    this.loadingMorosos = true;
    const params = new URLSearchParams();
    if (this.filtrosMorosos.mes) params.set('mes', String(this.filtrosMorosos.mes));
    if (this.filtrosMorosos.anio) params.set('anio', String(this.filtrosMorosos.anio));
    if (this.filtrosMorosos.categoriaId) params.set('categoriaId', String(this.filtrosMorosos.categoriaId));
    const query = params.toString() ? `?${params.toString()}` : '';
    this.api.get<ReporteMorosos>(`reportes/morosos${query}`).subscribe({
      next: (data) => {
        this.reporteMorosos = data;
        this.loadingMorosos = false;
      },
      error: () => this.loadingMorosos = false
    });
  }

  cargarCategoriasDropdown() {
    this.api.get<any>('categorias/active').subscribe({
      next: (data) => { this.categorias = Array.isArray(data) ? data : (data?.data ?? []); },
      error: () => {}
    });
  }

  limpiarFiltrosMorosos() {
    this.filtrosMorosos = { mes: null, anio: null, categoriaId: null };
    this.cargarMorosos();
  }

  getMesNombre(mes: number): string {
    return this.meses.find(m => m.value === mes)?.label?.slice(0, 3) ?? String(mes);
  }

  cargarProyeccion() {
    this.loadingProyeccion = true;
    const params = `mes=${this.filtrosProyeccion.mes}&anio=${this.filtrosProyeccion.anio}`;
    this.api.get<ProyeccionIngresos>(`reportes/proyeccion-ingresos?${params}`).subscribe({
      next: (data) => {
        this.proyeccion = data;
        this.proyeccionChartData = {
          labels: ['Recaudado', 'Pendiente'],
          datasets: [{
            data: [data.total_recaudado, data.total_pendiente],
            backgroundColor: ['#10b981', '#ef4444']
          }]
        };
        this.loadingProyeccion = false;
      },
      error: () => this.loadingProyeccion = false
    });
  }

  cargarCumplimiento() {
    this.loadingCategorias = true;
    const params = `mes=${this.filtrosCategorias.mes}&anio=${this.filtrosCategorias.anio}`;
    this.api.get<{ categorias: CumplimientoCategoria[] }>(`reportes/cumplimiento-categoria?${params}`).subscribe({
      next: (data) => {
        this.cumplimientoCategorias = data.categorias || [];
        this.actualizarGraficoCategorias();
        this.loadingCategorias = false;
      },
      error: () => this.loadingCategorias = false
    });
  }

  actualizarGraficoCategorias() {
    const labels = this.cumplimientoCategorias.map(c => c.categoria);
    const esperado = this.cumplimientoCategorias.map(c => c.esperado);
    const recaudado = this.cumplimientoCategorias.map(c => c.recaudado);

    this.categoriasChartData = {
      labels,
      datasets: [
        { data: esperado, label: 'Esperado', backgroundColor: '#94a3b8', borderRadius: 4 },
        { data: recaudado, label: 'Recaudado', backgroundColor: '#10b981', borderRadius: 4 }
      ]
    };
  }

  exportarMorosos() {
    if (!this.reporteMorosos) return;

    const rows = this.reporteMorosos.morosos.map(m => ({
      'Jugador': `${m.jugador.nombre} ${m.jugador.apellido}`,
      'Documento': m.jugador.documento,
      'Teléfono': m.jugador.telefono,
      'Categoría': m.jugador.categoria?.nombre || 'N/A',
      'Meses Vencidos': m.mensualidades_vencidas.map(mv => `${this.getMesNombre(mv.mes)} ${mv.anio}`).join(', '),
      'Cantidad Meses': m.mensualidades_vencidas.length,
      'Deuda Total': m.total_deuda,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-width
    const colWidths = Object.keys(rows[0] ?? {}).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String((r as any)[key] ?? '').length))
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Morosos');
    XLSX.writeFile(wb, `morosos_${this.getToday()}.xlsx`);
  }

  getPercent(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }

  getProgressClass(percent: number): string {
    if (percent >= 75) return 'high';
    if (percent >= 50) return 'medium';
    return 'low';
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-CO').format(num);
  }

  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  getFirstDayOfMonth(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  }
}
