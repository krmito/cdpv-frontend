import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar.component';

// Interfaces
interface Jugador {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  activo: boolean;
  categoria: {
    id: number;
    nombre: string;
    valor_mensualidad: number;
  };
}

interface Mensualidad {
  id: number;
  mes: number;
  anio: number;
  monto: number;
  monto_pagado: number;
  saldo_pendiente: number;
  fecha_vencimiento: string;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'parcial';
  fecha_creacion: string;
  jugador: Jugador;
}

interface GenerarMensualidadesDto {
  mes: number;
  anio: number;
  fecha_vencimiento?: string;
}

interface ResumenMensual {
  mes: number;
  anio: number;
  total_mensualidades: number;
  total_jugadores: number;
  total_esperado: number;
  total_recaudado: number;
  pagadas: number;
  pendientes: number;
  vencidas: number;
  parciales: number;
  porcentaje_cumplimiento: number;
  porcentaje_recaudo?: number;
}

@Component({
  selector: 'app-mensualidades',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent],
  templateUrl: './mensualidades.component.html',
  styleUrls: ['./mensualidades.component.css']
})
export class MensualidadesComponent implements OnInit {
  // Tabs
  activeTab: 'generar' | 'listado' | 'resumen' = 'generar';

  // Tab Generar
  generarData: GenerarMensualidadesDto = {
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    fecha_vencimiento: ''
  };
  generando = false;
  generarError = '';
  jugadoresActivos = 0;
  mensualidadesYaGeneradas = 0;
  mensualidadesFaltantes = 0;

  // Edición de mensualidad
  editandoMensualidad: Mensualidad | null = null;
  editFechaVencimiento = '';
  guardandoEdicion = false;

  // Eliminación de mensualidad
  eliminandoMensualidad: Mensualidad | null = null;
  eliminando = false;

  // Tab Listado
  mensualidades: Mensualidad[] = [];
  loadingMensualidades = false;
  filtrosMensualidades = {
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    estado: null as string | null,
    jugador: ''
  };
  currentPage = 1;
  pageSize = 20;
  totalMensualidades = 0;
  totalPages = 0;

  // Tab Resumen
  resumen: ResumenMensual | null = null;
  loadingResumen = false;
  mesResumen = new Date().getMonth() + 1;
  anioResumen = new Date().getFullYear();

  // General
  successMessage = '';
  meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.generarData.fecha_vencimiento = this.calcularFechaVencimientoDefault();
    this.cargarJugadoresActivos();
    this.verificarMensualidadesExistentes();
  }

  // ===== TAB MANAGEMENT =====
  changeTab(tab: 'generar' | 'listado' | 'resumen') {
    this.activeTab = tab;
    if (tab === 'listado') {
      this.loadMensualidades();
    } else if (tab === 'resumen') {
      this.loadResumen();
    }
  }

  // ===== TAB GENERAR =====
  cargarJugadoresActivos() {
    this.api.get<any>('jugadores?activo=true&limit=1000').subscribe({
      next: (response) => {
        this.jugadoresActivos = response.meta?.total || 0;
        this.calcularMensualidadesFaltantes();
      },
      error: (err) => {
        console.error('Error cargando jugadores activos:', err);
      }
    });
  }

  verificarMensualidadesExistentes() {
    // Convertir a números explícitamente
    const mes = Number(this.generarData.mes);
    const anio = Number(this.generarData.anio);
    
    const endpoint = `mensualidades?mes=${mes}&anio=${anio}&limit=1000`;
    
    console.log('🔍 Verificando mensualidades existentes...');
    console.log('📋 Endpoint:', endpoint);
    console.log('📅 Mes (número):', mes, typeof mes);
    console.log('📅 Año (número):', anio, typeof anio);
    
    this.api.get<any>(endpoint).subscribe({
      next: (response) => {
        console.log('✅ Respuesta completa del backend:', response);
        
        // Manejar diferentes estructuras de respuesta
        let total = 0;
        
        if (response.meta && response.meta.total !== undefined) {
          total = response.meta.total;
          console.log('✅ Total desde meta:', total);
        } else if (response.data && Array.isArray(response.data)) {
          total = response.data.length;
          console.log('✅ Total desde data.length:', total);
        } else if (Array.isArray(response)) {
          total = response.length;
          console.log('✅ Total desde response.length:', total);
        }
        
        this.mensualidadesYaGeneradas = total;
        console.log('✅ Mensualidades ya generadas:', this.mensualidadesYaGeneradas);
        
        this.calcularMensualidadesFaltantes();
        console.log('✅ Faltantes calculadas:', this.mensualidadesFaltantes);
      },
      error: (err) => {
        console.error('❌ Error verificando mensualidades:', err);
        // Si hay error, asumir que no hay mensualidades generadas
        this.mensualidadesYaGeneradas = 0;
        this.calcularMensualidadesFaltantes();
      }
    });
  }

  calcularMensualidadesFaltantes() {
    this.mensualidadesFaltantes = Math.max(0, this.jugadoresActivos - this.mensualidadesYaGeneradas);
  }

  onGenerarMesAnioChange() {
    this.verificarMensualidadesExistentes();
  }

  generarMensualidades() {
    if (!this.generarData.mes || !this.generarData.anio) {
      this.generarError = 'Seleccione mes y año';
      return;
    }

    if (this.mensualidadesFaltantes === 0) {
      this.generarError = 'Ya se generaron todas las mensualidades para este mes';
      return;
    }

    this.generando = true;
    this.generarError = '';

    // Asegurar que se envíen como números
    const payload: any = {
      mes: Number(this.generarData.mes),
      anio: Number(this.generarData.anio)
    };

    // Incluir fecha de vencimiento si está definida
    if (this.generarData.fecha_vencimiento) {
      payload.fecha_vencimiento = this.generarData.fecha_vencimiento;
    }

    console.log('📤 Generando mensualidades con payload:', payload);

    this.api.post<any>('mensualidades/generar', payload).subscribe({
      next: (response) => {
        this.generando = false;
        const cantidadGeneradas = response.cantidad_generadas || response.mensualidades?.length || 0;
        this.successMessage = `✓ Se generaron ${cantidadGeneradas} mensualidades para ${this.getNombreMes(this.generarData.mes)} ${this.generarData.anio}`;
        
        // Actualizar contadores
        this.verificarMensualidadesExistentes();
        
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        this.generando = false;
        this.generarError = err.error?.message || 'Error al generar mensualidades';
        console.error('Error generando mensualidades:', err);
      }
    });
  }

  // ===== TAB LISTADO =====
  loadMensualidades() {
    this.loadingMensualidades = true;

    // Convertir a números explícitamente
    const mes = Number(this.filtrosMensualidades.mes);
    const anio = Number(this.filtrosMensualidades.anio);

    let endpoint = `mensualidades?page=${this.currentPage}&limit=${this.pageSize}`;
    endpoint += `&mes=${mes}`;
    endpoint += `&anio=${anio}`;
    
    if (this.filtrosMensualidades.estado) {
      endpoint += `&estado=${this.filtrosMensualidades.estado}`;
    }
    if (this.filtrosMensualidades.jugador) {
      endpoint += `&jugador=${encodeURIComponent(this.filtrosMensualidades.jugador)}`;
    }

    console.log('🔍 Endpoint mensualidades:', endpoint);
    console.log('📅 Mes (número):', mes, typeof mes);
    console.log('📅 Año (número):', anio, typeof anio);

    this.api.get<any>(endpoint).subscribe({
      next: (response) => {
        console.log('✅ Respuesta mensualidades:', response);
        this.mensualidades = response.data || response;
        this.totalMensualidades = response.meta?.total || this.mensualidades.length;
        this.totalPages = response.meta?.totalPages || 1;
        this.currentPage = response.meta?.page || 1;
        this.loadingMensualidades = false;
      },
      error: (err) => {
        this.loadingMensualidades = false;
        console.error('❌ Error cargando mensualidades:', err);
      }
    });
  }

  onFiltroChange() {
    this.currentPage = 1;
    this.loadMensualidades();
  }

  cambiarPagina(page: number) {
    this.currentPage = page;
    this.loadMensualidades();
  }

  // ===== TAB RESUMEN =====
  loadResumen() {
    this.loadingResumen = true;

    // Convertir a números explícitamente
    const mes = Number(this.mesResumen);
    const anio = Number(this.anioResumen);

    // USAR PATH PARAMS en lugar de QUERY PARAMS
    const endpoint = `mensualidades/resumen/${mes}/${anio}`;

    console.log('📊 Cargando resumen mensual...');
    console.log('📋 Endpoint:', endpoint);
    console.log('📅 Mes (número):', mes, typeof mes);
    console.log('📅 Año (número):', anio, typeof anio);

    this.api.get<ResumenMensual>(endpoint).subscribe({
      next: (data) => {
        console.log('✅ Resumen recibido del backend:', data);
        console.log('📊 Estructura completa:', JSON.stringify(data, null, 2));
        console.log('👥 Total jugadores:', data.total_jugadores);
        console.log('✓ Pagadas:', data.pagadas);
        console.log('⏳ Pendientes:', data.pendientes);
        console.log('⚠️ Vencidas:', data.vencidas);
        console.log('💰 Total esperado:', data.total_esperado);
        console.log('💵 Total recaudado:', data.total_recaudado);
        console.log('📊 Porcentaje:', data.porcentaje_cumplimiento);
        
        this.resumen = data;
        this.loadingResumen = false;
      },
      error: (err) => {
        this.loadingResumen = false;
        console.error('❌ Error cargando resumen:', err);
        console.error('❌ Detalles del error:', err.error);
        
        // Mostrar mensaje de error al usuario
        if (err.status === 404) {
          console.warn('⚠️ El endpoint de resumen no existe aún');
        } else if (err.status === 400) {
          console.error('⚠️ Error de validación - Verificar que mes y año sean números');
        }
      }
    });
  }

  onResumenChange() {
    console.log('📅 Mes/Año cambió, recargando resumen...');
    this.loadResumen();
  }

  // Navegar al listado con filtro aplicado
  verListadoPorEstado(estado: string) {
    console.log('🔍 Navegando al listado con filtro:', estado);
    
    // Aplicar filtros
    this.filtrosMensualidades.mes = this.mesResumen;
    this.filtrosMensualidades.anio = this.anioResumen;
    this.filtrosMensualidades.estado = estado;
    this.filtrosMensualidades.jugador = '';
    
    // Cambiar al tab listado
    this.activeTab = 'listado';
    
    // Cargar datos con el filtro
    this.currentPage = 1;
    this.loadMensualidades();
  }

  // Navegar al listado mostrando todas
  verListadoTodas() {
    console.log('🔍 Navegando al listado (todas)');
    
    // Aplicar mes y año pero sin filtro de estado
    this.filtrosMensualidades.mes = this.mesResumen;
    this.filtrosMensualidades.anio = this.anioResumen;
    this.filtrosMensualidades.estado = null;
    this.filtrosMensualidades.jugador = '';
    
    // Cambiar al tab listado
    this.activeTab = 'listado';
    
    // Cargar datos
    this.currentPage = 1;
    this.loadMensualidades();
  }

  // ===== UTILIDADES =====
  getNombreMes(mes: number): string {
    const mesObj = this.meses.find(m => m.value === mes);
    return mesObj ? mesObj.label : '';
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'vencido': 'Vencido',
      'parcial': 'Parcial',
      'pagado': 'Pagado'
    };
    return labels[estado] || estado;
  }

  formatDate(dateString: string): string {
    // Extraer solo la parte de la fecha para evitar problemas de timezone
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-CO').format(num);
  }

  getPorcentajeColor(porcentaje: number): string {
    if (porcentaje >= 80) return 'success';
    if (porcentaje >= 50) return 'warning';
    return 'danger';
  }

  // ===== HELPER METHODS =====
  calcularFechaVencimientoDefault(): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 30);
    return fecha.toISOString().split('T')[0];
  }

  // ===== EDICIÓN DE MENSUALIDAD =====
  editarMensualidad(mensualidad: Mensualidad) {
    this.editandoMensualidad = mensualidad;
    // Extraer solo la parte de la fecha YYYY-MM-DD
    const datePart = mensualidad.fecha_vencimiento.split('T')[0];
    this.editFechaVencimiento = datePart;
  }

  cancelarEdicion() {
    this.editandoMensualidad = null;
    this.editFechaVencimiento = '';
  }

  guardarEdicion() {
    if (!this.editandoMensualidad || !this.editFechaVencimiento) return;

    this.guardandoEdicion = true;

    this.api.patch<any>(`mensualidades/${this.editandoMensualidad.id}`, {
      fecha_vencimiento: this.editFechaVencimiento
    }).subscribe({
      next: () => {
        this.guardandoEdicion = false;
        this.successMessage = '✓ Fecha de vencimiento actualizada';

        // Actualizar la mensualidad en la lista local
        const index = this.mensualidades.findIndex(m => m.id === this.editandoMensualidad!.id);
        if (index !== -1) {
          this.mensualidades[index].fecha_vencimiento = this.editFechaVencimiento;
        }

        this.cancelarEdicion();

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.guardandoEdicion = false;
        console.error('Error al actualizar mensualidad:', err);
      }
    });
  }

  // ===== ELIMINACIÓN DE MENSUALIDAD =====
  puedeEliminar(mensualidad: Mensualidad): boolean {
    return mensualidad.estado === 'pendiente' || mensualidad.estado === 'vencido';
  }

  confirmarEliminar(mensualidad: Mensualidad) {
    this.eliminandoMensualidad = mensualidad;
  }

  cancelarEliminar() {
    this.eliminandoMensualidad = null;
  }

  eliminarMensualidad() {
    if (!this.eliminandoMensualidad) return;

    this.eliminando = true;

    this.api.delete<any>(`mensualidades/${this.eliminandoMensualidad.id}`).subscribe({
      next: () => {
        this.eliminando = false;
        this.successMessage = '✓ Mensualidad eliminada correctamente';

        // Remover de la lista local
        this.mensualidades = this.mensualidades.filter(m => m.id !== this.eliminandoMensualidad!.id);
        this.totalMensualidades--;

        this.cancelarEliminar();

        // Actualizar contadores en tab generar
        this.verificarMensualidadesExistentes();

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.eliminando = false;
        console.error('Error al eliminar mensualidad:', err);
        alert(err.error?.message || 'Error al eliminar la mensualidad');
        this.cancelarEliminar();
      }
    });
  }
}
