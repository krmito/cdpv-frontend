import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CanComponentDeactivate } from '../../core/guards/unsaved-changes.guard';
import { PermisosService } from '../../core/services/permisos.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

// Interfaces
interface Jugador {
  id: number;
  nombre: string;
  apellido: string;
  tipo_documento: string;
  documento: string;
  fecha_nacimiento: string;
  direccion: string;
  telefono: string;
  telefono_acudiente: string | null;
  email: string;
  posicion: string | null;
  talla_camisa: string | null;
  dia_vencimiento: number;
  foto_url: string | null;
  activo: boolean;
  fecha_registro: string;
  categoria?: {
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
  jugador?: Jugador;
}

interface CreatePagoDto {
  mensualidad_id: number;
  monto_pagado: number;
  metodo_pago: string;
  observaciones?: string;
  fecha_limite?: string;
  comprobante_url?: string;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  usuario: string;
  rol: string;
  activo: boolean;
}

interface Comprobante {
  id: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamaño_bytes: number;
  fecha_subida: string;
}

interface Pago {
  id: number;
  numero_recibo: string;
  mensualidad: Mensualidad;
  jugador: Jugador;
  monto_pagado: number;
  metodo_pago: string;
  fecha_pago: string;
  observaciones: string;
  anulado: boolean;
  fecha_anulacion: string | null;
  motivo_anulacion?: string;
  registrado_por: Usuario;
  comprobantes?: Comprobante[];
}

interface PaginatedResponse {
  data: Pago[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface Estadisticas {
  total_hoy: number;
  total_mes: number;
  total_por_metodo: {
    efectivo: number;
    nequi: number;
    transferencia: number;
    otro: number;
  };
  cantidad_pagos_hoy: number;
  cantidad_pagos_mes: number;
}

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent, PageHeaderComponent],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit, CanComponentDeactivate {
  // Tabs
  activeTab: 'registrar' | 'historial' | 'estadisticas' = 'registrar';

  // Tab Registrar - Búsqueda de jugador
  documentoBusqueda = '';
  busquedaNombre = '';
  buscando = false;
  errorBusqueda = '';
  jugadorSeleccionado: Jugador | null = null;
  sugerenciasJugadores: Jugador[] = [];
  mostrarSugerencias = false;
  buscandoSugerencias = false;
  searchSugerenciasTimeout: any;

  // Tab Registrar - Mensualidades
  mensualidadesPendientes: Mensualidad[] = [];
  cargandoMensualidades = false;
  mensualidadSeleccionada: Mensualidad | null = null;

  // Tab Registrar - Formulario de pago
  showPagoForm = false;
  pagoData: CreatePagoDto = {
    mensualidad_id: 0,
    monto_pagado: 0,
    metodo_pago: '',
    observaciones: '',
    fecha_limite: '',
    comprobante_url: ''
  };
  guardando = false;
  formError = '';
  numeroReciboGenerado = '';

  // Comprobante
  comprobanteFile: File | null = null;
  comprobantePreview: string | null = null;
  subiendoComprobante = false;

  // Tab Historial - Lista y filtros
  pagos: Pago[] = [];
  loadingPagos = false;
  filtrosPagos = {
    search: '',
    metodo_pago: null as string | null,
    fecha_desde: '',
    fecha_hasta: ''
  };
  currentPagePagos = 1;
  pageSizePagos = 10;
  totalPagos = 0;
  totalPagesPagos = 0;

  // Tab Historial - Modales
  showDetalleModal = false;
  pagoSeleccionado: Pago | null = null;
  showAnularModal = false;
  pagoAAnular: Pago | null = null;
  motivoAnulacion = '';
  anulando = false;
  anularError = '';
  searchTimeout: any;

  // Tab Estadísticas
  estadisticas: Estadisticas = {
    total_hoy: 0,
    total_mes: 0,
    total_por_metodo: {
      efectivo: 0,
      nequi: 0,
      transferencia: 0,
      otro: 0
    },
    cantidad_pagos_hoy: 0,
    cantidad_pagos_mes: 0
  };
  loadingEstadisticas = false;

  // Filtros de estadísticas
  filtroEstadisticas = {
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    verTodoElAnio: false
  };
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

  // General
  successMessage = '';
  ultimoPagoRegistradoId: number | null = null;

  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  permisosService = inject(PermisosService);

  constructor(private api: ApiService) {}

  hasUnsavedChanges(): boolean {
    return !!(this.showPagoForm && (this.pagoData.monto_pagado > 0 || this.pagoData.metodo_pago));
  }

  ngOnInit() {
    this.generarNumeroRecibo();
    this.route.queryParams.subscribe(params => {
      const jugadorId = params['jugadorId'];
      if (jugadorId) {
        this.activeTab = 'registrar';
        this.api.get<Jugador>(`jugadores/${jugadorId}`).subscribe({
          next: (jugador) => {
            this.jugadorSeleccionado = jugador;
            this.busquedaNombre = `${jugador.nombre} ${jugador.apellido}`;
            this.cargarMensualidadesPendientes();
          },
          error: () => {
            this.toast.error('No se pudo cargar el jugador seleccionado');
          }
        });
      }
    });
  }

  // ===== TAB MANAGEMENT =====
  changeTab(tab: 'registrar' | 'historial' | 'estadisticas') {
    this.activeTab = tab;
    if (tab === 'historial') {
      this.loadPagos();
    } else if (tab === 'estadisticas') {
      this.loadEstadisticas();
    }
  }

  // ===== TAB REGISTRAR - BÚSQUEDA =====
  buscarJugador() {
    if (!this.documentoBusqueda.trim()) {
      this.errorBusqueda = 'Ingrese un documento válido';
      return;
    }

    this.buscando = true;
    this.errorBusqueda = '';
    this.jugadorSeleccionado = null;

    this.api.get<Jugador>(`jugadores/documento/${this.documentoBusqueda.trim()}`).subscribe({
      next: (jugador) => {
        this.buscando = false;
        this.jugadorSeleccionado = jugador;
        this.cargarMensualidadesPendientes();
      },
      error: (err) => {
        this.buscando = false;
        this.errorBusqueda = 'No se encontró un jugador con ese documento';
        console.error('Error buscando jugador:', err);
      }
    });
  }

  buscarSugerencias() {
    const texto = this.busquedaNombre.trim();

    if (texto.length < 2) {
      this.sugerenciasJugadores = [];
      this.mostrarSugerencias = false;
      return;
    }

    if (this.searchSugerenciasTimeout) {
      clearTimeout(this.searchSugerenciasTimeout);
    }

    this.searchSugerenciasTimeout = setTimeout(() => {
      this.buscandoSugerencias = true;
      this.mostrarSugerencias = true;

      this.api.get<any>(`jugadores?search=${encodeURIComponent(texto)}&activo=true&limit=10`).subscribe({
        next: (response) => {
          this.sugerenciasJugadores = response.data || response;
          this.buscandoSugerencias = false;
        },
        error: () => {
          this.sugerenciasJugadores = [];
          this.buscandoSugerencias = false;
        }
      });
    }, 300);
  }

  seleccionarJugadorSugerencia(jugador: Jugador) {
    this.jugadorSeleccionado = jugador;
    this.busquedaNombre = `${jugador.nombre} ${jugador.apellido}`;
    this.sugerenciasJugadores = [];
    this.mostrarSugerencias = false;
    this.errorBusqueda = '';
    this.cargarMensualidadesPendientes();
  }

  onInputBlur() {
    // Delay para permitir click en sugerencia antes de cerrar
    setTimeout(() => {
      this.mostrarSugerencias = false;
    }, 200);
  }

  onInputFocus() {
    if (this.busquedaNombre.trim().length >= 2 && this.sugerenciasJugadores.length > 0) {
      this.mostrarSugerencias = true;
    }
  }

  cargarMensualidadesPendientes() {
    if (!this.jugadorSeleccionado) return;

    this.cargandoMensualidades = true;
    
    this.api.get<Mensualidad[]>(`mensualidades/jugador/${this.jugadorSeleccionado.id}`).subscribe({
      next: (mensualidades) => {
        // Filtrar solo pendientes, vencidas y parciales
        this.mensualidadesPendientes = mensualidades
          .filter(m => m.estado !== 'pagado')
          .map(m => {
            // Agregar jugador a la mensualidad si no viene
            if (!m.jugador) {
              m.jugador = this.jugadorSeleccionado!;
            }
            return m;
          });
        this.cargandoMensualidades = false;
      },
      error: (err) => {
        this.cargandoMensualidades = false;
        console.error('Error cargando mensualidades:', err);
      }
    });
  }

  limpiarBusqueda() {
    this.documentoBusqueda = '';
    this.busquedaNombre = '';
    this.jugadorSeleccionado = null;
    this.mensualidadesPendientes = [];
    this.mensualidadSeleccionada = null;
    this.showPagoForm = false;
    this.errorBusqueda = '';
    this.sugerenciasJugadores = [];
    this.mostrarSugerencias = false;
  }

  // ===== TAB REGISTRAR - FORMULARIO PAGO =====
  seleccionarMensualidad(mensualidad: Mensualidad) {
    this.mensualidadSeleccionada = mensualidad;
    this.showPagoForm = true;
    this.pagoData.mensualidad_id = mensualidad.id;
    this.pagoData.monto_pagado = mensualidad.saldo_pendiente;

    // Establecer fecha límite por defecto (1 mes después)
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() + 1);
    this.pagoData.fecha_limite = fechaLimite.toISOString().split('T')[0];

    this.generarNumeroRecibo();
  }

  cerrarFormularioPago() {
    this.showPagoForm = false;
    this.mensualidadSeleccionada = null;
    this.pagoData = {
      mensualidad_id: 0,
      monto_pagado: 0,
      metodo_pago: '',
      observaciones: '',
      fecha_limite: '',
      comprobante_url: ''
    };
    this.comprobanteFile = null;
    this.comprobantePreview = null;
    this.formError = '';
  }

  generarNumeroRecibo() {
    const fecha = new Date();
    const timestamp = fecha.getTime().toString().slice(-8);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    this.numeroReciboGenerado = `REC-${timestamp}-${random}`;
  }

  isPagoFormValid(): boolean {
    const baseValid = !!(
      this.pagoData.monto_pagado > 0 &&
      this.pagoData.metodo_pago &&
      this.mensualidadSeleccionada
    );

    // Si es Nequi o Transferencia, el comprobante es obligatorio
    if (this.requiereComprobante()) {
      return baseValid && !!this.comprobanteFile;
    }

    return baseValid;
  }

  registrarPago() {
    if (!this.isPagoFormValid()) {
      this.formError = 'Complete todos los campos obligatorios';
      return;
    }

    if (this.pagoData.monto_pagado > this.mensualidadSeleccionada!.saldo_pendiente) {
      this.formError = 'El monto no puede ser mayor al pendiente';
      return;
    }

    this.guardando = true;
    this.formError = '';

    // Solo enviar campos que el backend acepta
    const dataToSend = {
      mensualidad_id: this.pagoData.mensualidad_id,
      monto_pagado: this.pagoData.monto_pagado,
      metodo_pago: this.pagoData.metodo_pago,
      observaciones: this.pagoData.observaciones
    };

    this.api.post<any>('pagos', dataToSend).subscribe({
      next: (response) => {
        const pago = response.data || response;
        const pagoId = pago.id;
        const numeroRecibo = response.numero_recibo || pago.numero_recibo;

        // Si hay comprobante, subirlo
        if (this.comprobanteFile && pagoId) {
          this.subirComprobante(pagoId, numeroRecibo);
        } else {
          this.guardando = false;
          this.ultimoPagoRegistradoId = pagoId;
          this.toast.success(`Pago registrado exitosamente. Recibo: ${numeroRecibo}`);
          this.cargarMensualidadesPendientes();
          this.cerrarFormularioPago();
        }
      },
      error: (err) => {
        this.guardando = false;
        this.formError = err.error?.message || 'Error al registrar el pago';
        console.error('Error registrando pago:', err);
      }
    });
  }

  // ===== TAB HISTORIAL =====
  loadPagos() {
    this.loadingPagos = true;

    let endpoint = `pagos?page=${this.currentPagePagos}&limit=${this.pageSizePagos}`;
    
    if (this.filtrosPagos.search) {
      endpoint += `&search=${encodeURIComponent(this.filtrosPagos.search)}`;
    }
    if (this.filtrosPagos.metodo_pago) {
      endpoint += `&metodo_pago=${this.filtrosPagos.metodo_pago}`;
    }
    if (this.filtrosPagos.fecha_desde) {
      endpoint += `&fecha_desde=${this.filtrosPagos.fecha_desde}`;
    }
    if (this.filtrosPagos.fecha_hasta) {
      endpoint += `&fecha_hasta=${this.filtrosPagos.fecha_hasta}`;
    }

    console.log('🔍 Endpoint de búsqueda:', endpoint);
    console.log('🔍 Filtros aplicados:', this.filtrosPagos);

    this.api.get<PaginatedResponse>(endpoint).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del backend:', response);
        console.log('✅ Total de pagos encontrados:', response.meta.total);
        this.pagos = response.data;
        this.totalPagos = response.meta.total;
        this.totalPagesPagos = response.meta.totalPages;
        this.currentPagePagos = response.meta.page;
        this.loadingPagos = false;
      },
      error: (err) => {
        this.loadingPagos = false;
        console.error('❌ Error cargando pagos:', err);
      }
    });
  }

  onFiltroChange() {
    this.currentPagePagos = 1;
    // Agregar pequeño delay para no hacer búsqueda en cada tecla
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadPagos();
    }, 300);
  }

  limpiarFiltros() {
    this.filtrosPagos = {
      search: '',
      metodo_pago: null,
      fecha_desde: '',
      fecha_hasta: ''
    };
    this.currentPagePagos = 1;
    this.loadPagos();
  }

  cambiarPagina(page: number) {
    this.currentPagePagos = page;
    this.loadPagos();
  }

  verDetallePago(pago: Pago) {
    // Cargar el pago completo con comprobantes
    this.api.get<Pago>(`pagos/${pago.id}`).subscribe({
      next: (pagoCompleto) => {
        this.pagoSeleccionado = pagoCompleto;
        this.showDetalleModal = true;
      },
      error: () => {
        // Si falla, mostrar el pago de la lista
        this.pagoSeleccionado = pago;
        this.showDetalleModal = true;
      }
    });
  }

  cerrarDetalleModal() {
    this.showDetalleModal = false;
    this.pagoSeleccionado = null;
  }

  abrirModalAnular(pago: Pago) {
    this.pagoAAnular = pago;
    this.showAnularModal = true;
    this.motivoAnulacion = '';
    this.anularError = '';
  }

  cerrarModalAnular() {
    this.showAnularModal = false;
    this.pagoAAnular = null;
    this.motivoAnulacion = '';
    this.anularError = '';
  }

  anularPago() {
    if (!this.motivoAnulacion.trim()) {
      this.anularError = 'El motivo es obligatorio';
      return;
    }

    this.anulando = true;
    this.anularError = '';

    this.api.delete(`pagos/${this.pagoAAnular!.id}/anular`).subscribe({
      next: () => {
        this.anulando = false;
        this.toast.success('Pago anulado exitosamente');
        this.cerrarModalAnular();
        this.loadPagos();
      },
      error: (err) => {
        this.anulando = false;
        this.anularError = err.error?.message || 'Error al anular el pago';
        console.error('Error anulando pago:', err);
      }
    });
  }

  exportarPagos() {
    // Generar CSV (compatible con Excel)
    const headers = ['N° Recibo', 'Fecha', 'Jugador', 'Documento', 'Periodo', 'Monto', 'Metodo', 'Estado', 'Observaciones'];

    const rows = this.pagos.map(pago => [
      pago.numero_recibo,
      this.formatDateTime(pago.fecha_pago),
      `${pago.jugador.nombre} ${pago.jugador.apellido}`,
      pago.jugador.documento,
      `${this.getNombreMes(pago.mensualidad.mes)} ${pago.mensualidad.anio}`,
      pago.monto_pagado,
      pago.metodo_pago,
      pago.anulado ? 'Anulado' : 'Activo',
      pago.observaciones || ''
    ]);

    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell =>
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');

    // Crear y descargar archivo
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fecha = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `pagos_${fecha}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toast.success('Archivo exportado exitosamente');
  }

  // ===== COMPROBANTE =====
  onComprobanteSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validar tipo de archivo
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!tiposPermitidos.includes(file.type)) {
        this.formError = 'Solo se permiten archivos JPG, PNG o PDF';
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.formError = 'El archivo no debe superar los 5MB';
        return;
      }

      this.comprobanteFile = file;

      // Crear preview si es imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.comprobantePreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.comprobantePreview = null;
      }
    }
  }

  removeComprobante() {
    this.comprobanteFile = null;
    this.comprobantePreview = null;
  }

  requiereComprobante(): boolean {
    return this.pagoData.metodo_pago === 'nequi' || this.pagoData.metodo_pago === 'transferencia';
  }

  subirComprobante(pagoId: number, numeroRecibo: string) {
    if (!this.comprobanteFile) return;

    const formData = new FormData();
    formData.append('file', this.comprobanteFile);

    this.subiendoComprobante = true;

    // Usar fetch para FormData ya que HttpClient puede tener problemas
    fetch(`http://localhost:3000/api/v1/pagos/${pagoId}/comprobante`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      },
      body: formData
    })
    .then(response => response.json())
    .then(() => {
      this.subiendoComprobante = false;
      this.guardando = false;
      this.ultimoPagoRegistradoId = pagoId;
      this.toast.success(`Pago registrado con comprobante. Recibo: ${numeroRecibo}`);
      this.cargarMensualidadesPendientes();
      this.cerrarFormularioPago();
    })
    .catch(() => {
      this.subiendoComprobante = false;
      this.guardando = false;
      this.ultimoPagoRegistradoId = pagoId;
      this.toast.warning(`Pago registrado. Recibo: ${numeroRecibo} (comprobante no se pudo subir)`);
      this.cargarMensualidadesPendientes();
      this.cerrarFormularioPago();
    });
  }

  descargarComprobante(comprobante: Comprobante) {
    const url = `http://localhost:3000/api/v1/pagos/comprobante/${comprobante.id}/download`;

    fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    })
    .then(response => response.blob())
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = comprobante.nombre_archivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    })
    .catch(err => {
      console.error('Error descargando comprobante:', err);
    });
  }

  descargarRecibo(pagoId: number) {
    this.api.getBlob(`pagos/${pagoId}/recibo-pdf`).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `recibo-${pagoId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error descargando recibo:', err);
      }
    });
  }

  // ===== TAB ESTADÍSTICAS =====
  loadEstadisticas() {
    this.loadingEstadisticas = true;

    // Obtener fecha de hoy para estadísticas del día
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    const fechaHoy = `${year}-${month}-${day}`;

    // Cargar estadísticas del día (siempre es hoy, por fecha de pago)
    this.api.get<any>(`reportes/caja?fechaInicio=${fechaHoy}&fechaFin=${fechaHoy}`).subscribe({
      next: (response) => {
        this.estadisticas.total_hoy = response.total_recaudado || 0;
        this.estadisticas.cantidad_pagos_hoy = response.total_pagos || 0;
      },
      error: (err) => console.error('Error cargando estadísticas del día:', err)
    });

    // Construir endpoint según filtros (por mes/año de mensualidad)
    let endpoint: string;
    const anio = this.filtroEstadisticas.anio;

    if (this.filtroEstadisticas.verTodoElAnio) {
      // Todo el año: usar rango de fechas de enero a diciembre
      endpoint = `reportes/caja?fechaInicio=${anio}-01-01&fechaFin=${anio}-12-31&agruparPor=metodo`;
    } else {
      // Mes específico: usar parámetros mes y anio para filtrar por mensualidad
      const mes = this.filtroEstadisticas.mes;
      endpoint = `reportes/caja?mes=${mes}&anio=${anio}&agruparPor=metodo`;
    }

    // Cargar estadísticas del período seleccionado
    this.api.get<any>(endpoint).subscribe({
      next: (response) => {
        this.estadisticas.total_mes = response.total_recaudado || 0;
        this.estadisticas.cantidad_pagos_mes = response.total_pagos || 0;

        // Procesar totales por método
        this.estadisticas.total_por_metodo = {
          efectivo: 0,
          nequi: 0,
          transferencia: 0,
          otro: 0
        };

        if (response.agrupado) {
          Object.keys(response.agrupado).forEach((metodo: string) => {
            const total = Number(response.agrupado[metodo].total) || 0;
            const metodoLower = metodo.toLowerCase();

            if (metodoLower === 'efectivo') {
              this.estadisticas.total_por_metodo.efectivo = total;
            } else if (metodoLower === 'nequi') {
              this.estadisticas.total_por_metodo.nequi = total;
            } else if (metodoLower === 'transferencia') {
              this.estadisticas.total_por_metodo.transferencia = total;
            } else {
              this.estadisticas.total_por_metodo.otro += total;
            }
          });
        }

        this.loadingEstadisticas = false;
      },
      error: (err) => {
        console.error('Error cargando estadísticas del período:', err);
        this.loadingEstadisticas = false;
      }
    });
  }

  onFiltroEstadisticasChange() {
    this.loadEstadisticas();
  }

  getPeriodoLabel(): string {
    if (this.filtroEstadisticas.verTodoElAnio) {
      return `Año ${this.filtroEstadisticas.anio}`;
    }
    const mesLabel = this.meses.find(m => m.value === this.filtroEstadisticas.mes)?.label || '';
    return `${mesLabel} ${this.filtroEstadisticas.anio}`;
  }

  getTotalPorMetodo(): number {
    return this.estadisticas.total_por_metodo.efectivo +
      this.estadisticas.total_por_metodo.nequi +
      this.estadisticas.total_por_metodo.transferencia +
      this.estadisticas.total_por_metodo.otro;
  }

  getPorcentajeMetodo(metodo: 'efectivo' | 'nequi' | 'transferencia' | 'otro'): number {
    const total = this.getTotalPorMetodo();
    if (total === 0) return 0;
    return Math.round((this.estadisticas.total_por_metodo[metodo] / total) * 100);
  }

  // ===== UTILIDADES =====
  getNombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1] || '';
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

  getMetodoLabel(metodo: string): string {
    const labels: Record<string, string> = {
      'efectivo': '💵 Efectivo',
      'nequi': '📱 Nequi',
      'transferencia': '🏦 Transferencia',
      'otro': '📝 Otro'
    };
    return labels[metodo] || metodo;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-CO').format(num);
  }
}
