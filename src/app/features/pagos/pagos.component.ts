import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { switchMap, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
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
  monto_descuento: number | null;
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

export interface ItemPagoRapido {
  idTemporal: string;
  lineaOriginal?: string;
  nombreCandidato?: string;
  categoriaPista?: string;
  mesDetectado?: number;
  mesNombre?: string;
  anioDetectado?: number;
  conceptosAdicionales?: string[];
  montoAdicional?: number;
  metodoPago: 'efectivo' | 'nequi' | 'transferencia';
  observaciones: string;
  montoPagar: number;
  coincidencia: 'exacta' | 'sugerida' | 'no_encontrado';
  score: number;
  jugador: Jugador | null;
  mensualidad: Mensualidad | null;
  sugerencias: { id: number; nombre: string; documento: string; categoria: string; score: number }[];
  incluir: boolean;
  comprobanteBase64?: string;
  comprobanteNombre?: string;
  comprobantePreview?: string;
  referencia?: string;
  mostrarDropdownJugadores?: boolean;
  esDobleMes?: boolean;
  montoMes1?: number;
  montoMes2?: number;
  idMensualidadMes1?: number | null;
  idMensualidadMes2?: number | null;
  mensualidadMes1?: Mensualidad | null;
  mensualidadMes2?: Mensualidad | null;
  mensualidadesDisponibles?: any[];
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
  activeTab: 'registrar' | 'historial' | 'estadisticas' | 'rapido' = 'registrar';

  // ===== REGISTRO RÁPIDO (WHATSAPP / NEQUI) =====
  textoWhatsApp = '';
  procesandoTextoWhatsApp = false;
  guardandoLoteRapido = false;
  itemsPagosRapidos: ItemPagoRapido[] = [];
  todosJugadores: Jugador[] = [];
  cargandoTodosJugadores = false;
  busquedaJugadorFila: { [idTemporal: string]: string } = {};
  anioActual: number = new Date().getFullYear();
  mesesDelAnio = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' },
  ];
  Math = Math;
  modalComprobanteVisible = false;
  comprobanteModalUrl: string | null = null;
  comprobanteModalTitulo = '';
  modalExitoLoteVisible = false;
  resultadoLoteExitoso: any = null;
  arrastrandoArchivos = false;
  modalBuscarJugadorVisible = false;
  itemParaAsignarJugador: ItemPagoRapido | null = null;
  busquedaJugadorModal = '';

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
  pagoDescuento: number | null = null;
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

  // Tab Historial - Editar pago
  showEditarPagoModal = false;
  pagoAEditar: Pago | null = null;
  editPagoData = { metodo_pago: '', observaciones: '' };
  guardandoEditPago = false;
  editPagoError = '';
  editComprobanteFile: File | null = null;
  subiendoEditComprobante = false;

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
  changeTab(tab: 'registrar' | 'historial' | 'estadisticas' | 'rapido') {
    this.activeTab = tab;
    if (tab === 'historial') {
      this.loadPagos();
    } else if (tab === 'estadisticas') {
      this.loadEstadisticas();
    } else if (tab === 'rapido') {
      this.cargarTodosJugadores();
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
    this.pagoDescuento = mensualidad.monto_descuento ?? null;

    // Establecer fecha límite por defecto (1 mes después)
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() + 1);
    this.pagoData.fecha_limite = fechaLimite.toISOString().split('T')[0];

    this.generarNumeroRecibo();
  }

  cerrarFormularioPago() {
    this.showPagoForm = false;
    this.mensualidadSeleccionada = null;
    this.pagoDescuento = null;
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

  onDescuentoChange() {
    if (!this.mensualidadSeleccionada) return;
    const descuento = this.pagoDescuento && this.pagoDescuento > 0 ? this.pagoDescuento : null;

    if (descuento != null) {
      // Crédito anterior ya aplicado en monto_pagado
      const creditoAnterior = this.mensualidadSeleccionada.monto_descuento != null
        ? Number(this.mensualidadSeleccionada.monto) - Number(this.mensualidadSeleccionada.monto_descuento)
        : 0;
      // Cash real pagado = monto_pagado - crédito anterior
      const cashPagado = Math.max(0, Number(this.mensualidadSeleccionada.monto_pagado) - creditoAnterior);
      // Con el nuevo descuento, el nuevo crédito
      const creditoNuevo = Number(this.mensualidadSeleccionada.monto) - descuento;
      // Nuevo saldo = monto - (cashPagado + creditoNuevo)
      this.pagoData.monto_pagado = Math.max(0, descuento - cashPagado);
    } else {
      this.pagoData.monto_pagado = Number(this.mensualidadSeleccionada.saldo_pendiente);
    }
  }

  registrarPago() {
    if (!this.isPagoFormValid()) {
      this.formError = 'Complete todos los campos obligatorios';
      return;
    }

    this.guardando = true;
    this.formError = '';

    // Determinar si hay un descuento nuevo a aplicar
    const descuentoNuevo = this.pagoDescuento && this.pagoDescuento > 0 ? this.pagoDescuento : null;
    const descuentoAnterior = this.mensualidadSeleccionada!.monto_descuento ?? null;
    const debeAplicarDescuento = descuentoNuevo !== descuentoAnterior;

    // Si hay descuento nuevo, primero actualizar la mensualidad, luego registrar el pago
    const paso1$ = debeAplicarDescuento
      ? this.api.patch<any>(`mensualidades/${this.mensualidadSeleccionada!.id}`, { monto_descuento: descuentoNuevo })
      : of(null);

    paso1$.pipe(
      switchMap((mensualidadActualizada) => {
        // Si aplicamos descuento, actualizar el saldo localmente antes del pago
        if (mensualidadActualizada?.data) {
          this.mensualidadSeleccionada = { ...this.mensualidadSeleccionada!, ...mensualidadActualizada.data };
        }
        const dataToSend = {
          mensualidad_id: this.pagoData.mensualidad_id,
          monto_pagado: this.pagoData.monto_pagado,
          metodo_pago: this.pagoData.metodo_pago,
          observaciones: this.pagoData.observaciones
        };
        return this.api.post<any>('pagos', dataToSend);
      })
    ).subscribe({
      next: (response) => {
        const pago = response.data || response;
        const pagoId = pago.id;
        const numeroRecibo = response.numero_recibo || pago.numero_recibo;

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

    this.api.delete(`pagos/${this.pagoAAnular!.id}/anular`, { motivo: this.motivoAnulacion }).subscribe({
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

  abrirEditarPago(pago: Pago) {
    this.pagoAEditar = pago;
    this.editPagoData = { metodo_pago: pago.metodo_pago, observaciones: pago.observaciones || '' };
    this.editPagoError = '';
    this.editComprobanteFile = null;
    this.showEditarPagoModal = true;
  }

  cerrarEditarPago() {
    this.showEditarPagoModal = false;
    this.pagoAEditar = null;
    this.editComprobanteFile = null;
    this.editPagoError = '';
  }

  onEditComprobanteSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!tiposPermitidos.includes(file.type)) {
        this.editPagoError = 'Solo se permiten archivos JPG, PNG o PDF';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.editPagoError = 'El archivo no debe superar los 5MB';
        return;
      }
      this.editComprobanteFile = file;
    }
  }

  guardarEditPago() {
    if (!this.editPagoData.metodo_pago) {
      this.editPagoError = 'Seleccione un método de pago';
      return;
    }

    this.guardandoEditPago = true;
    this.editPagoError = '';

    this.api.patch<any>(`pagos/${this.pagoAEditar!.id}`, this.editPagoData).subscribe({
      next: () => {
        if (this.editComprobanteFile) {
          this.subiendoEditComprobante = true;
          const formData = new FormData();
          formData.append('file', this.editComprobanteFile);
          this.api.postFile<any>(`pagos/${this.pagoAEditar!.id}/comprobante`, formData).subscribe({
            next: () => {
              this.guardandoEditPago = false;
              this.subiendoEditComprobante = false;
              this.toast.success('Pago actualizado con comprobante');
              this.cerrarEditarPago();
              this.loadPagos();
            },
            error: () => {
              this.guardandoEditPago = false;
              this.subiendoEditComprobante = false;
              this.toast.warning('Método de pago actualizado, pero el comprobante no se pudo subir');
              this.cerrarEditarPago();
              this.loadPagos();
            }
          });
        } else {
          this.guardandoEditPago = false;
          this.toast.success('Pago actualizado exitosamente');
          this.cerrarEditarPago();
          this.loadPagos();
        }
      },
      error: (err) => {
        this.guardandoEditPago = false;
        this.editPagoError = err.error?.message || 'Error al actualizar el pago';
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

    this.api.postFile<any>(`pagos/${pagoId}/comprobante`, formData).subscribe({
      next: () => {
        this.subiendoComprobante = false;
        this.guardando = false;
        this.ultimoPagoRegistradoId = pagoId;
        this.toast.success(`Pago registrado con comprobante. Recibo: ${numeroRecibo}`);
        this.cargarMensualidadesPendientes();
        this.cerrarFormularioPago();
      },
      error: () => {
        this.subiendoComprobante = false;
        this.guardando = false;
        this.ultimoPagoRegistradoId = pagoId;
        this.toast.warning(`Pago registrado. Recibo: ${numeroRecibo} (comprobante no se pudo subir)`);
        this.cargarMensualidadesPendientes();
        this.cerrarFormularioPago();
      }
    });
  }

  descargarComprobante(comprobante: Comprobante) {
    this.api.getBlob(`pagos/comprobante/${comprobante.id}/download`).subscribe({
      next: (blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = comprobante.nombre_archivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (err) => {
        console.error('Error descargando comprobante:', err);
        this.toast.error('No se pudo descargar el comprobante');
      }
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

  // ===== MÉTODOS DE REGISTRO RÁPIDO (WHATSAPP / NEQUI) =====

  cargarTodosJugadores() {
    if (this.todosJugadores.length > 0) return;
    this.cargandoTodosJugadores = true;
    this.api.get<any>('jugadores?limit=1000').subscribe({
      next: (res) => {
        this.todosJugadores = res.data || res || [];
        this.cargandoTodosJugadores = false;
      },
      error: () => {
        this.cargandoTodosJugadores = false;
      }
    });
  }

  interpretarTextoWhatsApp() {
    if (!this.textoWhatsApp.trim()) {
      this.toast.error('Por favor escribe o pega texto del chat de WhatsApp');
      return;
    }

    this.procesandoTextoWhatsApp = true;
    this.api.post<any>('pagos/interpretar-whatsapp', { texto: this.textoWhatsApp }).subscribe({
      next: (res) => {
        this.procesandoTextoWhatsApp = false;
        const nuevosItems: ItemPagoRapido[] = (res.items || []).map((it: any) => ({
          idTemporal: it.idTemporal || Math.random().toString(36).substring(2, 9),
          lineaOriginal: it.lineaOriginal,
          nombreCandidato: it.nombreCandidato,
          categoriaPista: it.categoriaPista,
          mesDetectado: it.mesDetectado,
          mesNombre: it.mesNombre,
          anioDetectado: it.anioDetectado,
          conceptosAdicionales: it.conceptosAdicionales || [],
          montoAdicional: it.montoAdicional,
          metodoPago: it.metodoSugerido || 'efectivo',
          observaciones: it.observaciones || '',
          montoPagar: it.montoPagar || 0,
          coincidencia: it.coincidencia || 'no_encontrado',
          score: it.score || 0,
          jugador: it.jugador || null,
          mensualidad: it.mensualidad || null,
          sugerencias: it.sugerencias || [],
          incluir: it.incluir !== undefined ? it.incluir : (it.coincidencia !== 'no_encontrado' && !!it.mensualidad),
          mostrarDropdownJugadores: false,
        }));

        this.itemsPagosRapidos = [...this.itemsPagosRapidos, ...nuevosItems];
        this.toast.success(`Se interpretaron ${nuevosItems.length} líneas. ${res.coincidenciasExactas || 0} coincidencias directas.`);
        this.textoWhatsApp = '';
      },
      error: (err) => {
        this.procesandoTextoWhatsApp = false;
        this.toast.error(err.error?.message || 'Error al procesar el texto de WhatsApp');
      }
    });
  }

  cargarEjemploWhatsApp() {
    this.textoWhatsApp =
`Juan David Caballero Sub 15 paga Agosto
Dilan Dominguez Sub 14 paga Agosto y $ 60.000 de Uniforme
Jeremi Mateo Quintero Sub 14 paga Agosto
Favid Torres Eatacio Sub 8 paga Uniforme y SEPTIEMBRE`;
  }

  limpiarTextoWhatsApp() {
    this.textoWhatsApp = '';
  }

  onComprobantesSeleccionados(event: any) {
    const files: FileList = event.target?.files;
    if (files && files.length > 0) {
      this.procesarArchivosComprobantes(files);
      event.target.value = '';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.arrastrandoArchivos = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.arrastrandoArchivos = false;
  }

  onDropComprobantes(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.arrastrandoArchivos = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.procesarArchivosComprobantes(files);
    }
  }

  procesarArchivosComprobantes(files: FileList | File[]) {
    const imageFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        imageFiles.push(file);
      }
    }

    if (imageFiles.length === 0) {
      this.toast.error('Solo se admiten archivos de imagen (capturas de Nequi)');
      return;
    }

    this.toast.info(`Escaneando ${imageFiles.length} comprobante(s) de Nequi...`);

    imageFiles.forEach((file) => {
      const formData = new FormData();
      formData.append('file', file);

      this.api.post<any>('pagos/escanear-nequi', formData).subscribe({
        next: (itemEscaneado) => {
          // 1. ¿Existe una fila que ya tenga a este jugador o candidado?
          const filaMismoJugador = itemEscaneado.jugador
            ? this.itemsPagosRapidos.find(it => it.jugador?.id === itemEscaneado.jugador.id && !it.comprobanteBase64)
            : null;

          // 2. O una fila manual completamente vacía
          const filaVacia = this.itemsPagosRapidos.find(it =>
            !it.comprobanteBase64 &&
            !it.jugador &&
            (it.lineaOriginal === 'Registro Manual' || it.montoPagar === 0)
          );

          const filaDestino = filaMismoJugador || filaVacia;

          if (filaDestino) {
            filaDestino.comprobanteBase64 = itemEscaneado.comprobanteBase64;
            filaDestino.comprobanteNombre = file.name;
            filaDestino.comprobantePreview = itemEscaneado.comprobantePreview;
            filaDestino.metodoPago = 'nequi';
            filaDestino.montoPagar = itemEscaneado.montoPagar || filaDestino.montoPagar;
            filaDestino.lineaOriginal = itemEscaneado.lineaOriginal;
            filaDestino.nombreCandidato = itemEscaneado.nombreCandidato;
            filaDestino.categoriaPista = itemEscaneado.categoriaPista;
            filaDestino.mesDetectado = itemEscaneado.mesDetectado;
            filaDestino.mesNombre = itemEscaneado.mesNombre;
            filaDestino.anioDetectado = itemEscaneado.anioDetectado;
            filaDestino.observaciones = itemEscaneado.observaciones || filaDestino.observaciones;
            filaDestino.referencia = itemEscaneado.referencia;
            filaDestino.coincidencia = itemEscaneado.coincidencia;
            filaDestino.score = itemEscaneado.score;
            filaDestino.jugador = itemEscaneado.jugador || filaDestino.jugador;
            filaDestino.mensualidad = itemEscaneado.mensualidad || filaDestino.mensualidad;
            filaDestino.sugerencias = itemEscaneado.sugerencias || [];
            filaDestino.incluir = itemEscaneado.incluir;
            filaDestino.mostrarDropdownJugadores = !filaDestino.jugador;

            if (itemEscaneado.esDobleMes) {
              filaDestino.esDobleMes = true;
              filaDestino.montoMes1 = itemEscaneado.montoMes1 || 50000;
              filaDestino.montoMes2 = itemEscaneado.montoMes2 || 50000;
              filaDestino.idMensualidadMes1 = itemEscaneado.idMensualidadMes1;
              filaDestino.idMensualidadMes2 = itemEscaneado.idMensualidadMes2;
              filaDestino.mensualidadMes1 = itemEscaneado.mensualidadMes1;
              filaDestino.mensualidadMes2 = itemEscaneado.mensualidadMes2;
              filaDestino.mensualidadesDisponibles = itemEscaneado.mensualidadesDisponibles || [];
            }

            const jugadorNom = filaDestino.jugador ? `${filaDestino.jugador.nombre} ${filaDestino.jugador.apellido}` : filaDestino.nombreCandidato;
            this.toast.success(`Comprobante adjuntado: ${jugadorNom} - $${this.formatNumber(filaDestino.montoPagar)} ${itemEscaneado.referencia ? '(' + itemEscaneado.referencia + ')' : ''}`);
          } else {
            this.itemsPagosRapidos.push(itemEscaneado);
            const msg = itemEscaneado.jugador
              ? `Comprobante leído: ${itemEscaneado.jugador.nombre} ${itemEscaneado.jugador.apellido} - $${this.formatNumber(itemEscaneado.montoPagar)}`
              : `Comprobante leído: $${this.formatNumber(itemEscaneado.montoPagar)} - ${itemEscaneado.lineaOriginal}`;
            this.toast.success(msg);
          }
        },
        error: (err) => {
          console.error('Error al escanear comprobante:', err);
          this.toast.error(err.error?.message || 'Error al procesar el comprobante mediante OCR.');
          const reader = new FileReader();
          reader.onload = (e: any) => {
            const base64Data = e.target.result;
            const nuevaFila: ItemPagoRapido = {
              idTemporal: Math.random().toString(36).substring(2, 9),
              lineaOriginal: `Comprobante Nequi (${file.name})`,
              nombreCandidato: '',
              metodoPago: 'nequi',
              observaciones: 'Pago Nequi',
              montoPagar: 0,
              coincidencia: 'no_encontrado',
              score: 0,
              jugador: null,
              mensualidad: null,
              sugerencias: [],
              incluir: false,
              comprobanteBase64: base64Data,
              comprobanteNombre: file.name,
              comprobantePreview: base64Data,
              mostrarDropdownJugadores: true,
            };
            this.itemsPagosRapidos.push(nuevaFila);
          };
          reader.readAsDataURL(file);
        }
      });
    });
  }

  asociarComprobanteFila(item: ItemPagoRapido, event: any) {
    const file: File = event.target?.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      this.toast.info('Extrayendo datos del comprobante con OCR...');

      this.api.post<any>('pagos/escanear-nequi', formData).subscribe({
        next: (itemEscaneado) => {
          item.comprobanteBase64 = itemEscaneado.comprobanteBase64;
          item.comprobanteNombre = file.name;
          item.comprobantePreview = itemEscaneado.comprobantePreview;
          item.metodoPago = 'nequi';

          if (itemEscaneado.montoPagar > 0) {
            item.montoPagar = itemEscaneado.montoPagar;
          }
          if (itemEscaneado.observaciones) {
            item.observaciones = itemEscaneado.observaciones;
          }
          if (itemEscaneado.referencia) {
            item.referencia = itemEscaneado.referencia;
          }
          if (itemEscaneado.lineaOriginal) {
            item.lineaOriginal = itemEscaneado.lineaOriginal;
          }
          if (itemEscaneado.nombreCandidato) {
            item.nombreCandidato = itemEscaneado.nombreCandidato;
          }
          if (itemEscaneado.categoriaPista) {
            item.categoriaPista = itemEscaneado.categoriaPista;
          }
          if (itemEscaneado.mesNombre) {
            item.mesNombre = itemEscaneado.mesNombre;
            item.mesDetectado = itemEscaneado.mesDetectado;
            item.anioDetectado = itemEscaneado.anioDetectado;
          }
          if (itemEscaneado.sugerencias && itemEscaneado.sugerencias.length > 0) {
            item.sugerencias = itemEscaneado.sugerencias;
          }
          if (itemEscaneado.esDobleMes) {
            item.esDobleMes = true;
            item.montoMes1 = itemEscaneado.montoMes1 || 50000;
            item.montoMes2 = itemEscaneado.montoMes2 || 50000;
            item.idMensualidadMes1 = itemEscaneado.idMensualidadMes1;
            item.idMensualidadMes2 = itemEscaneado.idMensualidadMes2;
            item.mensualidadMes1 = itemEscaneado.mensualidadMes1;
            item.mensualidadMes2 = itemEscaneado.mensualidadMes2;
            item.mensualidadesDisponibles = itemEscaneado.mensualidadesDisponibles || [];
          }
          if (!item.jugador && itemEscaneado.jugador) {
            item.jugador = itemEscaneado.jugador;
            item.mensualidad = itemEscaneado.mensualidad;
            item.coincidencia = itemEscaneado.coincidencia;
            item.score = itemEscaneado.score;
            item.incluir = itemEscaneado.incluir;
            item.mostrarDropdownJugadores = false;
          }
          this.toast.success(`Datos extraídos: $${this.formatNumber(item.montoPagar)} ${item.referencia ? '(' + item.referencia + ')' : ''}`);
        },
        error: (err) => {
          console.error('Error al escanear comprobante fila:', err);
          this.toast.error(err.error?.message || 'Error al procesar el comprobante mediante OCR.');
          const reader = new FileReader();
          reader.onload = (e: any) => {
            item.comprobanteBase64 = e.target.result;
            item.comprobanteNombre = file.name;
            item.comprobantePreview = e.target.result;
            item.metodoPago = 'nequi';
            this.toast.success('Comprobante adjuntado (sin OCR)');
          };
          reader.readAsDataURL(file);
        }
      });
      event.target.value = '';
    }
  }

  toggleDobleMes(item: ItemPagoRapido) {
    item.esDobleMes = !item.esDobleMes;
    if (item.esDobleMes) {
      const mitad = Math.round(Number(item.montoPagar || 100000) / 2);
      item.montoMes1 = mitad || 50000;
      item.montoMes2 = mitad || 50000;
      if (item.jugador && (!item.mensualidadesDisponibles || item.mensualidadesDisponibles.length === 0)) {
        this.cargarMensualidadesDobleMes(item);
      }
    }
  }

  cargarMensualidadesDobleMes(item: ItemPagoRapido) {
    this.cargarMensualidadesJugador(item);
  }

  onMesDobleChange(item: ItemPagoRapido) {
    if (!item.mensualidadesDisponibles) return;
    const m1 = item.mensualidadesDisponibles.find(m => m.id === Number(item.idMensualidadMes1));
    const m2 = item.mensualidadesDisponibles.find(m => m.id === Number(item.idMensualidadMes2));
    if (m1) item.mensualidadMes1 = m1;
    if (m2) item.mensualidadMes2 = m2;

    if (m1 && m2) {
      item.mesNombre = `${this.getNombreMes(m1.mes)} y ${this.getNombreMes(m2.mes)} ${m2.anio}`;
    }
  }

  onMontoDobleChange(item: ItemPagoRapido) {
    if (item.esDobleMes) {
      const mitad = Math.round(Number(item.montoPagar || 0) / 2);
      item.montoMes1 = mitad;
      item.montoMes2 = mitad;
    }
  }

  desglosarEnDosFilas(item: ItemPagoRapido) {
    const idx = this.itemsPagosRapidos.findIndex(it => it.idTemporal === item.idTemporal);
    if (idx === -1) return;

    let m1 = item.mensualidadMes1;
    let m2 = item.mensualidadMes2;

    if (!m1 && item.idMensualidadMes1 && item.mensualidadesDisponibles) {
      m1 = item.mensualidadesDisponibles.find(m => m.id === Number(item.idMensualidadMes1));
    }
    if (!m2 && item.idMensualidadMes2 && item.mensualidadesDisponibles) {
      m2 = item.mensualidadesDisponibles.find(m => m.id === Number(item.idMensualidadMes2));
    }

    m1 = m1 || item.mensualidad;
    m2 = m2 || item.mensualidad;

    const monto1 = Number(item.montoMes1) || Math.round(Number(item.montoPagar || 100000) / 2);
    const monto2 = Number(item.montoMes2) || Math.round(Number(item.montoPagar || 100000) / 2);

    const fila1: ItemPagoRapido = {
      idTemporal: Math.random().toString(36).substring(2, 9),
      lineaOriginal: `${item.lineaOriginal || 'Pago'} (Mes 1)`,
      nombreCandidato: item.nombreCandidato,
      categoriaPista: item.categoriaPista,
      mesDetectado: m1?.mes,
      mesNombre: m1 ? `${this.getNombreMes(m1.mes)} ${m1.anio}` : 'Mes 1',
      anioDetectado: m1?.anio,
      metodoPago: item.metodoPago,
      observaciones: item.observaciones ? `${item.observaciones} (Mes 1/2: ${m1 ? this.getNombreMes(m1.mes) : ''})`.trim() : 'Mes 1/2',
      montoPagar: monto1,
      referencia: item.referencia,
      coincidencia: item.coincidencia,
      score: item.score,
      jugador: item.jugador,
      mensualidad: m1,
      sugerencias: item.sugerencias || [],
      incluir: true,
      comprobanteBase64: item.comprobanteBase64,
      comprobanteNombre: item.comprobanteNombre,
      comprobantePreview: item.comprobantePreview,
      esDobleMes: false,
    };

    const fila2: ItemPagoRapido = {
      idTemporal: Math.random().toString(36).substring(2, 9),
      lineaOriginal: `${item.lineaOriginal || 'Pago'} (Mes 2)`,
      nombreCandidato: item.nombreCandidato,
      categoriaPista: item.categoriaPista,
      mesDetectado: m2?.mes,
      mesNombre: m2 ? `${this.getNombreMes(m2.mes)} ${m2.anio}` : 'Mes 2',
      anioDetectado: m2?.anio,
      metodoPago: item.metodoPago,
      observaciones: item.observaciones ? `${item.observaciones} (Mes 2/2: ${m2 ? this.getNombreMes(m2.mes) : ''})`.trim() : 'Mes 2/2',
      montoPagar: monto2,
      referencia: item.referencia,
      coincidencia: item.coincidencia,
      score: item.score,
      jugador: item.jugador,
      mensualidad: m2,
      sugerencias: item.sugerencias || [],
      incluir: true,
      comprobanteBase64: item.comprobanteBase64,
      comprobanteNombre: item.comprobanteNombre,
      comprobantePreview: item.comprobantePreview,
      esDobleMes: false,
    };

    this.itemsPagosRapidos.splice(idx, 1, fila1, fila2);
    this.toast.success(`Desglosado en 2 filas: $${this.formatNumber(monto1)} y $${this.formatNumber(monto2)}`);
  }

  quitarComprobanteFila(item: ItemPagoRapido) {
    item.comprobanteBase64 = undefined;
    item.comprobanteNombre = undefined;
    item.comprobantePreview = undefined;
  }

  verComprobanteEnModal(item: ItemPagoRapido) {
    if (item.comprobantePreview || item.comprobanteBase64) {
      this.comprobanteModalUrl = item.comprobantePreview || item.comprobanteBase64 || null;
      this.comprobanteModalTitulo = `Comprobante: ${item.jugador ? (item.jugador.nombre + ' ' + item.jugador.apellido) : item.nombreCandidato || 'Sin asignar'}`;
      this.modalComprobanteVisible = true;
    }
  }

  cerrarModalComprobante() {
    this.modalComprobanteVisible = false;
    this.comprobanteModalUrl = null;
  }

  contarCoincidenciasExactas(): number {
    return this.itemsPagosRapidos.filter(r => r.coincidencia === 'exacta').length;
  }

  contarCoincidenciasSugeridas(): number {
    return this.itemsPagosRapidos.filter(r => r.coincidencia === 'sugerida').length;
  }

  contarNoEncontrados(): number {
    return this.itemsPagosRapidos.filter(r => r.coincidencia === 'no_encontrado').length;
  }

  abrirModalBuscarJugador(item: ItemPagoRapido) {
    this.itemParaAsignarJugador = item;
    this.busquedaJugadorModal = item.nombreCandidato || '';
    this.modalBuscarJugadorVisible = true;
    this.cargarTodosJugadores();
  }

  cerrarModalBuscarJugador() {
    this.modalBuscarJugadorVisible = false;
    this.itemParaAsignarJugador = null;
    this.busquedaJugadorModal = '';
  }

  seleccionarJugadorDesdeModal(jugador: any) {
    if (!this.itemParaAsignarJugador) return;
    this.seleccionarJugadorFila(this.itemParaAsignarJugador, jugador);
    this.cerrarModalBuscarJugador();
  }

  getJugadoresFiltradosModal(): Jugador[] {
    const rawQuery = (this.busquedaJugadorModal || '').toLowerCase().trim();
    if (!this.todosJugadores || this.todosJugadores.length === 0) return [];
    if (!rawQuery) return this.todosJugadores.slice(0, 40);

    const queryNorm = rawQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return this.todosJugadores.filter(j => {
      const nombreCompleto = `${j.nombre || ''} ${j.apellido || ''}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const doc = (j.documento ? String(j.documento) : '').toLowerCase();
      const cat = (j.categoria?.nombre || '').toLowerCase();
      return nombreCompleto.includes(queryNorm) || doc.includes(queryNorm) || cat.includes(queryNorm);
    }).slice(0, 40);
  }

  toggleDropdownJugadores(item: ItemPagoRapido) {
    this.abrirModalBuscarJugador(item);
  }

  cerrarDropdownJugadores(item: ItemPagoRapido) {
    this.cerrarModalBuscarJugador();
  }

  seleccionarJugadorFila(item: ItemPagoRapido, jugadorInput: any) {
    const jugadorReal = this.todosJugadores.find(j => j.id === jugadorInput.id) || jugadorInput;
    item.jugador = jugadorReal;
    item.coincidencia = 'exacta';
    item.score = 1;
    item.mostrarDropdownJugadores = false;
    delete this.busquedaJugadorFila[item.idTemporal];

    // Cargar mensualidades del jugador seleccionado
    this.cargarMensualidadesJugador(item);
  }

  cargarMensualidadesJugador(item: ItemPagoRapido) {
    if (!item.jugador) return;
    const anio = item.anioDetectado || this.anioActual;
    const mes = item.mesDetectado || (new Date().getMonth() + 1);

    this.api.get<Mensualidad[]>(`mensualidades/jugador/${item.jugador.id}`).subscribe({
      next: (mensualidades) => {
        const ordenadas = [...(mensualidades || [])].sort((a, b) => {
          if (a.anio !== b.anio) return a.anio - b.anio;
          return a.mes - b.mes;
        });

        item.mensualidadesDisponibles = ordenadas.map(m => ({
          id: m.id,
          mes: m.mes,
          anio: m.anio,
          mesNombre: `${this.getNombreMes(m.mes)} ${m.anio}`,
          monto: Number(m.monto),
          saldo_pendiente: Number(m.saldo_pendiente),
          estado: m.estado
        }));

        if (item.esDobleMes) {
          const pendientes = ordenadas.filter(m => m.estado !== 'pagado' && Number(m.saldo_pendiente) > 0);
          if (pendientes.length >= 2) {
            item.idMensualidadMes1 = pendientes[pendientes.length - 2].id;
            item.mensualidadMes1 = pendientes[pendientes.length - 2];
            item.idMensualidadMes2 = pendientes[pendientes.length - 1].id;
            item.mensualidadMes2 = pendientes[pendientes.length - 1];
          } else if (pendientes.length === 1) {
            item.idMensualidadMes1 = pendientes[0].id;
            item.mensualidadMes1 = pendientes[0];
            item.idMensualidadMes2 = pendientes[0].id;
            item.mensualidadMes2 = pendientes[0];
          } else if (ordenadas.length > 0) {
            item.idMensualidadMes1 = ordenadas[ordenadas.length - 1].id;
            item.mensualidadMes1 = ordenadas[ordenadas.length - 1];
            item.idMensualidadMes2 = ordenadas[ordenadas.length - 1].id;
            item.mensualidadMes2 = ordenadas[ordenadas.length - 1];
          }
          this.onMesDobleChange(item);
        } else {
          // Modo mes único:
          // 1. Buscar si existe mensualidad para el mes que se detectó o seleccionó
          let mens: any = null;
          if (item.mesDetectado) {
            mens = ordenadas.find(m => m.mes === item.mesDetectado && m.anio === anio);
          }
          // 2. Si no hay para ese mes exacto pero no hay selección explícita previa, buscar la más antigua pendiente
          if (!mens && !item.mesDetectado) {
            mens = ordenadas.find(m => m.estado !== 'pagado' && Number(m.saldo_pendiente) > 0);
          }

          if (mens) {
            item.mensualidad = mens;
            item.mesDetectado = mens.mes;
            item.anioDetectado = mens.anio;
            item.mesNombre = `${this.getNombreMes(mens.mes)} ${mens.anio}`;
            if (!item.montoPagar || item.montoPagar <= 0) {
              item.montoPagar = Number(mens.saldo_pendiente);
            }
          } else {
            // El jugador no tiene mensualidad en BD para ese mes aún (se creará bajo demanda al registrar)
            item.mesDetectado = mes;
            item.anioDetectado = anio;
            item.mesNombre = `${this.getNombreMes(mes)} ${anio}`;
            item.mensualidad = null;
            if (!item.montoPagar || item.montoPagar <= 0) {
              item.montoPagar = item.jugador.categoria?.valor_mensualidad || 50000;
            }
          }
        }
        item.incluir = true;
      },
      error: () => {
        item.incluir = true;
        if (!item.montoPagar || item.montoPagar <= 0) {
          item.montoPagar = item.jugador?.categoria?.valor_mensualidad || 50000;
        }
      }
    });
  }

  getMesSingleValue(item: ItemPagoRapido): string {
    if (item.mensualidad?.id) {
      return `id:${item.mensualidad.id}`;
    }
    const mes = item.mesDetectado || (item.mensualidad ? (item.mensualidad as any).mes : (new Date().getMonth() + 1));
    const anio = item.anioDetectado || (item.mensualidad ? (item.mensualidad as any).anio : this.anioActual);
    return `mes:${mes}:${anio}`;
  }

  onMesSingleChange(item: ItemPagoRapido, event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (!val) return;

    if (val.startsWith('id:')) {
      const id = parseInt(val.substring(3), 10);
      const m = item.mensualidadesDisponibles?.find(x => x.id === id);
      if (m) {
        item.mensualidad = m;
        item.mesDetectado = m.mes;
        item.anioDetectado = m.anio;
        item.mesNombre = m.mesNombre;
        item.montoPagar = Number(m.saldo_pendiente) > 0 ? Number(m.saldo_pendiente) : (Number(item.montoPagar) || Number(m.monto) || 50000);
      }
    } else if (val.startsWith('mes:')) {
      const parts = val.split(':');
      const mes = parseInt(parts[1], 10);
      const anio = parseInt(parts[2], 10);
      item.mesDetectado = mes;
      item.anioDetectado = anio;
      item.mesNombre = `${this.getNombreMes(mes)} ${anio}`;

      // Si el jugador ya tiene mensualidades cargadas en BD, ver si ya existe ese registro
      if (item.mensualidadesDisponibles && item.mensualidadesDisponibles.length > 0) {
        const m = item.mensualidadesDisponibles.find(x => x.mes === mes && x.anio === anio);
        if (m) {
          item.mensualidad = m;
          item.montoPagar = Number(m.saldo_pendiente) > 0 ? Number(m.saldo_pendiente) : (Number(item.montoPagar) || Number(m.monto) || 50000);
          return;
        }
      }

      // No existe en BD para este jugador todavía
      item.mensualidad = null;
      if (item.jugador?.categoria?.valor_mensualidad) {
        item.montoPagar = Number(item.jugador.categoria.valor_mensualidad);
      }
    }
  }

  getJugadoresFiltrados(idTemporal: string): Jugador[] {
    const rawQuery = (this.busquedaJugadorFila[idTemporal] || '').toLowerCase().trim();
    if (!this.todosJugadores || this.todosJugadores.length === 0) return [];
    if (!rawQuery) return this.todosJugadores.slice(0, 20);

    const queryNorm = rawQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return this.todosJugadores.filter(j => {
      const nombreCompleto = `${j.nombre || ''} ${j.apellido || ''}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const doc = (j.documento ? String(j.documento) : '').toLowerCase();
      const cat = (j.categoria?.nombre || '').toLowerCase();
      return nombreCompleto.includes(queryNorm) || doc.includes(queryNorm) || cat.includes(queryNorm);
    }).slice(0, 20);
  }

  cambiarMetodoFila(item: ItemPagoRapido, metodo: 'efectivo' | 'nequi' | 'transferencia') {
    item.metodoPago = metodo;
  }

  eliminarFilaRapida(idTemporal: string) {
    this.itemsPagosRapidos = this.itemsPagosRapidos.filter(it => it.idTemporal !== idTemporal);
  }

  agregarFilaVaciaRapida() {
    this.cargarTodosJugadores();
    this.itemsPagosRapidos.push({
      idTemporal: Math.random().toString(36).substring(2, 9),
      lineaOriginal: 'Registro Manual',
      nombreCandidato: '',
      metodoPago: 'efectivo',
      observaciones: '',
      montoPagar: 0,
      coincidencia: 'no_encontrado',
      score: 0,
      jugador: null,
      mensualidad: null,
      sugerencias: [],
      incluir: false,
      mostrarDropdownJugadores: true,
    });
  }

  limpiarTodasFilasRapidas() {
    if (confirm('¿Deseas vaciar la lista de pagos rápidos?')) {
      this.itemsPagosRapidos = [];
    }
  }

  toggleTodosRapidos(event: any) {
    const checked = event.target?.checked;
    this.itemsPagosRapidos.forEach(it => {
      if (it.jugador && it.mensualidad) {
        it.incluir = checked;
      }
    });
  }

  todosRapidosSeleccionados(): boolean {
    const validos = this.itemsPagosRapidos.filter(it => it.jugador && (it.mensualidad || (it.esDobleMes && it.idMensualidadMes1) || it.mesDetectado));
    return validos.length > 0 && validos.every(it => it.incluir);
  }

  contarRapidosSeleccionados(): number {
    return this.itemsPagosRapidos.filter(it => it.incluir && it.jugador && (it.mensualidad || (it.esDobleMes && it.idMensualidadMes1) || it.mesDetectado)).length;
  }

  totalMontoRapido(): number {
    return this.itemsPagosRapidos
      .filter(it => it.incluir && it.jugador && (it.mensualidad || (it.esDobleMes && it.idMensualidadMes1) || it.mesDetectado))
      .reduce((sum, it) => sum + (Number(it.montoPagar) || 0), 0);
  }

  totalEfectivoRapido(): number {
    return this.itemsPagosRapidos
      .filter(it => it.incluir && it.jugador && (it.mensualidad || (it.esDobleMes && it.idMensualidadMes1) || it.mesDetectado) && it.metodoPago === 'efectivo')
      .reduce((sum, it) => sum + (Number(it.montoPagar) || 0), 0);
  }

  totalNequiRapido(): number {
    return this.itemsPagosRapidos
      .filter(it => it.incluir && it.jugador && (it.mensualidad || (it.esDobleMes && it.idMensualidadMes1) || it.mesDetectado) && it.metodoPago === 'nequi')
      .reduce((sum, it) => sum + (Number(it.montoPagar) || 0), 0);
  }

  registrarLoteRapido() {
    const itemsValidos = this.itemsPagosRapidos.filter(it => it.incluir && it.jugador && (it.mensualidad || (it.esDobleMes && it.idMensualidadMes1) || it.mesDetectado));

    if (itemsValidos.length === 0) {
      this.toast.error('No hay pagos seleccionados con jugador y mensualidad válidos.');
      return;
    }

    this.guardandoLoteRapido = true;

    const pagosPayload: any[] = [];
    for (const it of itemsValidos) {
      if (it.esDobleMes && it.idMensualidadMes1 && it.idMensualidadMes2) {
        const monto1 = Number(it.montoMes1) || Math.round(Number(it.montoPagar || 100000) / 2);
        const monto2 = Number(it.montoMes2) || Math.round(Number(it.montoPagar || 100000) / 2);
        pagosPayload.push({
          mensualidad_id: Number(it.idMensualidadMes1),
          monto_pagado: monto1,
          metodo_pago: it.metodoPago,
          observaciones: (it.observaciones ? `${it.observaciones} - Mes 1/2` : 'Pago Mes 1/2').trim(),
          comprobante_archivo: it.comprobanteBase64 || undefined,
          jugador_id: it.jugador!.id,
        });
        pagosPayload.push({
          mensualidad_id: Number(it.idMensualidadMes2),
          monto_pagado: monto2,
          metodo_pago: it.metodoPago,
          observaciones: (it.observaciones ? `${it.observaciones} - Mes 2/2` : 'Pago Mes 2/2').trim(),
          comprobante_archivo: it.comprobanteBase64 || undefined,
          jugador_id: it.jugador!.id,
        });
      } else {
        pagosPayload.push({
          mensualidad_id: it.mensualidad ? it.mensualidad.id : undefined,
          mes: it.mesDetectado || (it.mensualidad ? (it.mensualidad as any).mes : (new Date().getMonth() + 1)),
          anio: it.anioDetectado || (it.mensualidad ? (it.mensualidad as any).anio : this.anioActual),
          monto_pagado: Number(it.montoPagar),
          metodo_pago: it.metodoPago,
          observaciones: it.observaciones || undefined,
          comprobante_archivo: it.comprobanteBase64 || undefined,
          jugador_id: it.jugador!.id,
        });
      }
    }

    const payload = { pagos: pagosPayload };

    this.api.post<any>('pagos/lote', payload).subscribe({
      next: (res) => {
        this.guardandoLoteRapido = false;
        this.resultadoLoteExitoso = res;
        this.modalExitoLoteVisible = true;

        // Quitar de la lista los que se registraron
        const idsProcesados = new Set(itemsValidos.map(it => it.idTemporal));
        this.itemsPagosRapidos = this.itemsPagosRapidos.filter(it => !idsProcesados.has(it.idTemporal));

        this.toast.success(res.message || `Se registraron ${res.exitosos} pagos exitosamente.`);
      },
      error: (err) => {
        this.guardandoLoteRapido = false;
        this.toast.error(err.error?.message || 'Error al registrar el lote de pagos');
      }
    });
  }

  cerrarModalExitoLote() {
    this.modalExitoLoteVisible = false;
    this.resultadoLoteExitoso = null;
    this.changeTab('historial');
  }
}
