import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { CanComponentDeactivate } from '../../core/guards/unsaved-changes.guard';
import { PermisosService } from '../../core/services/permisos.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  valor_mensualidad: number;
  activo: boolean;
}

interface Mensualidad {
  id: number;
  estado: string;
  fecha_vencimiento: string;
  saldo_pendiente: number;
}

interface Jugador {
  id: number;
  nombre: string;
  apellido: string;
  tipo_documento: string;
  documento?: string | null;
  fecha_nacimiento?: string | null;
  fecha_ingreso?: string | null;
  telefono: string;
  telefono_acudiente: string;
  email: string;
  email_acudiente: string;
  direccion: string;
  categoria: Categoria;
  activo: boolean;
  fecha_registro: string;
  foto_url?: string;
  posicion: string;
  mensualidades?: Mensualidad[];
}

interface PaginatedResponse {
  data: Jugador[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface CreateJugadorDto {
  nombre: string;
  apellido: string;
  tipo_documento: string;
  documento?: string;
  fecha_nacimiento?: string;
  fecha_ingreso?: string;
  telefono: string;
  telefono_acudiente?: string;
  email?: string;
  email_acudiente?: string;
  direccion?: string;
  categoria_id: number;
  posicion?: string;
}

@Component({
  selector: 'app-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent, PageHeaderComponent],
  template: `
    <div class="layout">
      <app-navbar/>
      <div class="main-container">
        <app-sidebar/>
        <main class="content">
          <app-page-header
            title="Jugadores"
            subtitle="Gestiona los jugadores del club"
            icon="👥"
          />
          <div class="header-actions">
            @if (permisosService.canCreate('jugadores')) {
              <button class="btn btn-success btn-new" (click)="openImportModal()">
                <span>📥</span> Importar Excel
              </button>
              <button class="btn btn-primary btn-new" (click)="openNewForm()">
                <span>➕</span> Nuevo Jugador
              </button>
            }
          </div>

          <!-- Mensaje de éxito -->
          @if (successMessage) {
            <div class="alert alert-success">
              ✓ {{ successMessage }}
            </div>
          }

          <!-- Filtros -->
          <div class="card filters-card">
            <div class="filters-grid">
              <div class="form-group">
                <label>Buscar</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="filters.search"
                  (ngModelChange)="onFilterChange()"
                  placeholder="Nombre o documento..."
                />
              </div>

              <div class="form-group">
                <label>Categoría</label>
                <select 
                  class="form-control"
                  [(ngModel)]="filters.categoria_id"
                  (ngModelChange)="onFilterChange()"
                >
                  <option [ngValue]="null">Todas las categorías</option>
                  @for (cat of categorias; track cat.id) {
                    <option [ngValue]="cat.id">{{ cat.nombre }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Estado</label>
                <select 
                  class="form-control"
                  [(ngModel)]="filters.activo"
                  (ngModelChange)="onFilterChange()"
                >
                  <option [ngValue]="null">Todos</option>
                  <option [ngValue]="true">Activos</option>
                  <option [ngValue]="false">Inactivos</option>
                </select>
              </div>

              <div class="form-group" style="display: flex; align-items: flex-end;">
                <button class="btn btn-secondary" (click)="clearFilters()">
                  🔄 Limpiar
                </button>
              </div>
            </div>
          </div>

          <!-- Skeleton loader -->
          @if (loading) {
            <div class="card skeleton-card" aria-busy="true" aria-label="Cargando jugadores">
              <div class="skeleton-header">
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-badge"></div>
              </div>
              @for (i of [1,2,3,4,5]; track i) {
                <div class="skeleton-row">
                  <div class="skeleton-circle"></div>
                  <div class="skeleton-line skeleton-sm"></div>
                  <div class="skeleton-line skeleton-md"></div>
                  <div class="skeleton-line skeleton-sm"></div>
                  <div class="skeleton-line skeleton-sm"></div>
                  <div class="skeleton-line skeleton-md"></div>
                  <div class="skeleton-line skeleton-xs"></div>
                  <div class="skeleton-line skeleton-xs"></div>
                </div>
              }
            </div>
          }

          <!-- Error -->
          @if (error) {
            <div class="alert alert-danger" role="alert">
              {{ error }}
            </div>
          }

          <!-- Tabla de Jugadores -->
          @if (!loading && !error) {
            <div class="card">
              <div class="table-header">
                <h3>Lista de Jugadores</h3>
                <span class="badge">{{ totalJugadores }} jugadores</span>
              </div>

              @if (jugadores.length === 0) {
                <div class="empty-state">
                  <span class="empty-icon">👥</span>
                  <h4>No se encontraron jugadores</h4>
                  <p>Agrega el primer jugador o ajusta los filtros de búsqueda</p>
                  @if (permisosService.canCreate('jugadores')) {
                    <button class="btn btn-primary" (click)="openNewForm()" aria-label="Agregar primer jugador">
                      ➕ Agregar Primer Jugador
                    </button>
                  }
                </div>
              } @else {
                <div class="table-container card-table">
                  <table>
                    <caption>Listado de jugadores del club</caption>
                    <thead>
                      <tr>
                        <th>Foto</th>
                        <th>Documento</th>
                        <th>Nombre Completo</th>
                        <th>Categoría</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Estado</th>
                        <th>Pagos</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (jugador of jugadores; track jugador.id) {
                        <tr>
                          <td data-label="">
                            @if (jugador.foto_url) {
                              <img [src]="getFotoUrl(jugador.foto_url)" class="avatar-sm clickable" (click)="openFotoViewer(jugador)" alt="Foto">
                            } @else {
                              <div class="avatar-sm avatar-initials" [style.background-color]="getAvatarColor(jugador.nombre)">
                                {{ getInitials(jugador.nombre, jugador.apellido) }}
                              </div>
                            }
                          </td>
                          <td data-label="Documento"><strong>{{ jugador.documento }}</strong></td>
                          <td data-label="Nombre">{{ jugador.nombre }} {{ jugador.apellido }}</td>
                          <td data-label="Categoría">
                            <span class="categoria-badge">
                              {{ jugador.categoria.nombre }}
                            </span>
                          </td>
                          <td data-label="Teléfono">{{ jugador.telefono || 'N/A' }}</td>
                          <td data-label="Email">{{ jugador.email || 'N/A' }}</td>
                          <td data-label="Estado">
                            <span [class]="jugador.activo ? 'status-active' : 'status-inactive'">
                              {{ jugador.activo ? '✓ Activo' : '✗ Inactivo' }}
                            </span>
                          </td>
                          <td data-label="Pagos">
                            <span
                              [class]="'pago-badge ' + getEstadoPago(jugador).clase + (permisosService.canView('pagos') ? ' pago-badge-link' : '')"
                              [title]="permisosService.canView('pagos') ? 'Ir a Pagos' : ''"
                              (click)="irAPagos(jugador)">
                              {{ getEstadoPago(jugador).texto }}
                            </span>
                          </td>
                          <td data-label="">
                            <div class="action-buttons">
                              <button class="btn-icon" (click)="verHistorial(jugador)" [attr.aria-label]="'Ver historial de ' + jugador.nombre + ' ' + jugador.apellido" title="Ver Historial">
                                📋
                              </button>
                              @if (permisosService.canEdit('jugadores')) {
                                <button class="btn-icon" (click)="openEditForm(jugador)" [attr.aria-label]="'Editar ' + jugador.nombre + ' ' + jugador.apellido" title="Editar">
                                  ✏️
                                </button>
                              }
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Paginación -->
                <div class="pagination">
                  <button 
                    class="btn btn-sm"
                    [disabled]="currentPage === 1"
                    (click)="changePage(currentPage - 1)"
                  >
                    ← Anterior
                  </button>
                  
                  <span class="page-info">
                    Página {{ currentPage }} de {{ totalPages }}
                  </span>
                  
                  <button 
                    class="btn btn-sm"
                    [disabled]="currentPage === totalPages"
                    (click)="changePage(currentPage + 1)"
                  >
                    Siguiente →
                  </button>
                </div>
              }
            </div>
          }

          <!-- Modal Nuevo Jugador -->
          @if (showNewForm) {
            <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-new-title">
              <div class="modal-card">
                <div class="modal-header">
                  <h2 id="modal-new-title">➕ Nuevo Jugador</h2>
                  <button class="btn-close" (click)="closeNewForm()" aria-label="Cerrar modal">✕</button>
                </div>
                
                <form (ngSubmit)="onSubmit()">
                  <div class="modal-body">
                    <div class="scan-section">
                      <input #docScanInput type="file" accept=".jpg,.jpeg,.png,.webp"
                             capture="environment" style="display:none"
                             (change)="onDocScanSelected($event)">
                      @if (!scanSuccess) {
                        <button type="button" class="btn btn-outline-secondary btn-scan"
                                (click)="docScanInput.click()" [disabled]="escaneando">
                          {{ escaneando ? '⏳ Extrayendo datos...' : '📷 Escanear documento de identidad' }}
                        </button>
                      }
                      @if (scanSuccess) {
                        <div class="scan-badge-ok">✓ Datos extraídos del documento. Revisa y completa los campos faltantes.</div>
                      }
                      @if (scanError && !scanQuotaExceeded && !scanApiKeyError) {
                        <div class="alert alert-danger" role="alert">{{ scanError }}</div>
                      }
                      @if (scanQuotaExceeded) {
                        <div class="scan-quota-warning" role="alert">
                          <strong>⚠️ Límite de escaneos alcanzado</strong>
                          <p>Has superado el límite de uso de Gemini AI. Para seguir usando esta función, revisa tu plan en Google AI Studio.</p>
                          <a href="https://ai.google.dev/pricing" target="_blank" rel="noopener" class="btn-quota-link">Ver planes de Gemini →</a>
                        </div>
                      }
                      @if (scanApiKeyError) {
                        <div class="scan-quota-warning" role="alert">
                          <strong>⚠️ Función no configurada</strong>
                          <p>Para usar el escaneo de documentos con IA necesitas una cuenta en <strong>Google AI Studio</strong> con un método de pago activo. Una vez configurada, el costo es muy bajo: aproximadamente <strong>USD $0.10 por cada 1.000 escaneos</strong> (imágenes).</p>
                          <p>Consulta la sección <strong>Ayuda → Jugadores</strong> para ver cómo configurarlo paso a paso.</p>
                          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" class="btn-quota-link">Configurar en Google AI Studio →</a>
                        </div>
                      }
                    </div>

                    @if (formError) {
                      <div class="alert alert-danger">
                        {{ formError }}
                      </div>
                    }

                    <div class="foto-upload-section">
                      @if (fotoPreview) {
                        <img [src]="fotoPreview" class="foto-preview" alt="Preview">
                      } @else {
                        <div class="avatar-lg avatar-initials" style="background-color: #94a3b8;">
                          {{ getInitials(newJugador.nombre || '?', newJugador.apellido || '?') }}
                        </div>
                      }
                      <button type="button" class="btn btn-secondary btn-sm" (click)="newFotoInput.click()">
                        {{ fotoPreview ? 'Cambiar foto' : 'Agregar foto' }}
                      </button>
                      <input #newFotoInput type="file" accept="image/jpeg,image/png" (change)="onFotoSelected($event)" style="display:none">
                      @if (fotoPreview) {
                        <small class="foto-hint">La foto se guardará al crear el jugador</small>
                      }
                    </div>

                    @if (!advertenciaIgnorada && (buscandoSimilares || jugadoresSimilares.length > 0)) {
                      <div class="duplicados-warning" role="alert" aria-live="polite">
                        <div class="duplicados-warning-header">
                          <div class="duplicados-warning-text">
                            <strong>Posibles jugadores duplicados</strong>
                            <p>Encontramos jugadores con apellido similar. Verifica que no esté ya registrado.</p>
                          </div>
                          <button type="button" class="btn-ignorar-similares" (click)="ignorarSimilares()">
                            Ignorar y continuar
                          </button>
                        </div>
                        @if (buscandoSimilares) {
                          <p class="similares-buscando">Buscando...</p>
                        }
                        @if (!buscandoSimilares && jugadoresSimilares.length > 0) {
                          <div class="similares-lista">
                            @for (j of jugadoresSimilares; track j.id) {
                              <div class="similar-item">
                                @if (j.foto_url) {
                                  <img [src]="apiBaseUrl + j.foto_url" class="avatar-sm" [alt]="j.nombre">
                                } @else {
                                  <div class="avatar-sm avatar-initials" [style.background-color]="getAvatarColor(j.nombre)">
                                    {{ getInitials(j.nombre, j.apellido) }}
                                  </div>
                                }
                                <div class="similar-info">
                                  <span class="similar-nombre">{{ j.nombre }} {{ j.apellido }}</span>
                                  <span class="similar-meta">
                                    @if (j.documento) { Doc: {{ j.documento }} &middot; }
                                    {{ j.categoria?.nombre }}
                                    &middot; {{ j.activo ? 'Activo' : 'Inactivo' }}
                                  </span>
                                </div>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }

                    <div class="form-section">
                      <h3>Datos Personales</h3>

                      <div class="form-row">
                        <div class="form-group">
                          <label for="new-nombre">Nombre <span class="required">*</span></label>
                          <input
                            id="new-nombre"
                            type="text"
                            [class]="'form-control' + ((formSubmitted || newFormTouched['nombre']) && !newJugador.nombre ? ' is-invalid' : '')"
                            [(ngModel)]="newJugador.nombre"
                            name="nombre"
                            required
                            placeholder="Juan"
                            (blur)="touchNewField('nombre')"
                            (ngModelChange)="onNombreChange()"
                            [attr.aria-invalid]="(formSubmitted || newFormTouched['nombre']) && !newJugador.nombre"
                            aria-describedby="new-nombre-error"
                          />
                          @if ((formSubmitted || newFormTouched['nombre']) && !newJugador.nombre) {
                            <span id="new-nombre-error" class="field-error" role="alert">El nombre es obligatorio</span>
                          }
                        </div>

                        <div class="form-group">
                          <label for="new-apellido">Apellido <span class="required">*</span></label>
                          <input
                            id="new-apellido"
                            type="text"
                            [class]="'form-control' + ((formSubmitted || newFormTouched['apellido']) && !newJugador.apellido ? ' is-invalid' : '')"
                            [(ngModel)]="newJugador.apellido"
                            name="apellido"
                            required
                            placeholder="Pérez García"
                            (blur)="touchNewField('apellido')"
                            (ngModelChange)="onApellidoChange()"
                            [attr.aria-invalid]="(formSubmitted || newFormTouched['apellido']) && !newJugador.apellido"
                            aria-describedby="new-apellido-error"
                          />
                          @if ((formSubmitted || newFormTouched['apellido']) && !newJugador.apellido) {
                            <span id="new-apellido-error" class="field-error" role="alert">El apellido es obligatorio</span>
                          }
                        </div>
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label for="new-tipo-doc">Tipo Documento</label>
                          <select
                            id="new-tipo-doc"
                            class="form-control"
                            [(ngModel)]="newJugador.tipo_documento"
                            name="tipo_documento"
                          >
                            <option value="CC">CC - Cédula de Ciudadanía</option>
                            <option value="TI">TI - Tarjeta de Identidad</option>
                            <option value="CE">CE - Cédula de Extranjería</option>
                            <option value="RC">RC - Registro Civil</option>
                            <option value="PA">PA - Pasaporte</option>
                          </select>
                        </div>

                        <div class="form-group">
                          <label for="new-documento">Documento</label>
                          <input
                            id="new-documento"
                            type="text"
                            class="form-control"
                            [(ngModel)]="newJugador.documento"
                            name="documento"
                            placeholder="1234567890"
                            maxlength="15"
                          />
                        </div>
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label for="new-fecha">Fecha de Nacimiento</label>
                          <input
                            id="new-fecha"
                            type="date"
                            class="form-control"
                            [(ngModel)]="newJugador.fecha_nacimiento"
                            name="fecha_nacimiento"
                          />
                        </div>

                        <div class="form-group">
                          <label for="new-fecha-ingreso">Fecha de Ingreso al Equipo</label>
                          <input
                            id="new-fecha-ingreso"
                            type="date"
                            class="form-control"
                            [(ngModel)]="newJugador.fecha_ingreso"
                            name="fecha_ingreso"
                          />
                        </div>
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label for="new-posicion">Posición</label>
                          <input
                            id="new-posicion"
                            type="text"
                            class="form-control"
                            [(ngModel)]="newJugador.posicion"
                            name="posicion"
                            placeholder="Delantero"
                          />
                        </div>
                      </div>
                    </div>

                    <div class="form-section">
                      <h3>Información de Contacto</h3>

                      <div class="form-row">
                        <div class="form-group">
                          <label for="new-telefono">Teléfono</label>
                          <input
                            id="new-telefono"
                            type="tel"
                            [class]="'form-control' + ((newFormTouched['telefono']) && newJugador.telefono && !isValidOptionalPhone(newJugador.telefono) ? ' is-invalid' : '')"
                            [(ngModel)]="newJugador.telefono"
                            name="telefono"
                            placeholder="3001234567"
                            maxlength="15"
                            (blur)="touchNewField('telefono')"
                            [attr.aria-invalid]="(newFormTouched['telefono']) && newJugador.telefono && !isValidOptionalPhone(newJugador.telefono)"
                            aria-describedby="new-telefono-error"
                          />
                          @if ((newFormTouched['telefono']) && newJugador.telefono && !isValidOptionalPhone(newJugador.telefono)) {
                            <span id="new-telefono-error" class="field-error" role="alert">Ingrese un número válido (ej: 3001234567)</span>
                          }
                        </div>

                        <div class="form-group">
                          <label>Teléfono Acudiente</label>
                          <input
                            type="tel"
                            [class]="'form-control' + ((newFormTouched['telefono_acudiente']) && !isValidOptionalPhone(newJugador.telefono_acudiente) ? ' is-invalid' : '')"
                            [(ngModel)]="newJugador.telefono_acudiente"
                            name="telefono_acudiente"
                            placeholder="3109876543"
                            maxlength="15"
                            (blur)="touchNewField('telefono_acudiente')"
                          />
                          @if ((newFormTouched['telefono_acudiente']) && newJugador.telefono_acudiente && !isValidOptionalPhone(newJugador.telefono_acudiente)) {
                            <span class="field-error" role="alert">Ingrese un número válido (ej: 3109876543)</span>
                          }
                        </div>
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            [class]="'form-control' + ((newFormTouched['email']) && !isValidEmail(newJugador.email) ? ' is-invalid' : '')"
                            [(ngModel)]="newJugador.email"
                            name="email"
                            placeholder="jugador@example.com"
                            (blur)="touchNewField('email')"
                          />
                          @if ((newFormTouched['email']) && newJugador.email && !isValidEmail(newJugador.email)) {
                            <span class="field-error" role="alert">Ingrese un correo electrónico válido</span>
                          }
                        </div>

                        <div class="form-group">
                          <label>Email Acudiente</label>
                          <input
                            type="email"
                            [class]="'form-control' + ((newFormTouched['email_acudiente']) && !isValidEmail(newJugador.email_acudiente) ? ' is-invalid' : '')"
                            [(ngModel)]="newJugador.email_acudiente"
                            name="email_acudiente"
                            placeholder="acudiente@example.com"
                            (blur)="touchNewField('email_acudiente')"
                          />
                          @if ((newFormTouched['email_acudiente']) && newJugador.email_acudiente && !isValidEmail(newJugador.email_acudiente)) {
                            <span class="field-error" role="alert">Ingrese un correo electrónico válido</span>
                          }
                        </div>
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label>Dirección</label>
                          <input
                            type="text"
                            class="form-control"
                            [(ngModel)]="newJugador.direccion"
                            name="direccion"
                            placeholder="Calle 123 #45-67"
                          />
                        </div>
                      </div>
                    </div>

                    <div class="form-section">
                      <h3>Categoría</h3>

                      <div class="form-group">
                        <label for="new-categoria">Categoría <span class="required">*</span></label>
                        <select
                          id="new-categoria"
                          [class]="'form-control' + ((formSubmitted || newFormTouched['categoria_id']) && !(newJugador.categoria_id > 0) ? ' is-invalid' : '')"
                          [(ngModel)]="newJugador.categoria_id"
                          name="categoria_id"
                          required
                          (blur)="touchNewField('categoria_id')"
                          [attr.aria-invalid]="(formSubmitted || newFormTouched['categoria_id']) && !(newJugador.categoria_id > 0)"
                          aria-describedby="new-categoria-error"
                        >
                          <option [ngValue]="0">Seleccione una categoría</option>
                          @for (cat of categorias; track cat.id) {
                            <option [ngValue]="cat.id">
                              {{ cat.nombre }} - \${{ formatNumber(cat.valor_mensualidad) }}/mes
                            </option>
                          }
                        </select>
                        @if ((formSubmitted || newFormTouched['categoria_id']) && !(newJugador.categoria_id > 0)) {
                          <span id="new-categoria-error" class="field-error" role="alert">Selecciona una categoría</span>
                        }
                        @if (selectedCategoria) {
                          <div class="categoria-info">
                            <p><strong>Mensualidad:</strong> \${{ formatNumber(selectedCategoria.valor_mensualidad) }}</p>
                            <p><strong>Descripción:</strong> {{ selectedCategoria.descripcion }}</p>
                          </div>
                        }
                      </div>
                    </div>

                    <div class="form-note">
                      <p><span class="required">*</span> Campos obligatorios</p>
                    </div>
                  </div>

                  <div class="modal-footer">
                    <button
                      type="button"
                      class="btn btn-secondary"
                      (click)="closeNewForm()"
                      [disabled]="saving"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      class="btn btn-primary"
                      [disabled]="saving"
                    >
                      {{ saving ? 'Guardando...' : '✓ Guardar Jugador' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          }

          <!-- Modal Editar Jugador -->
          @if (showEditForm && editingJugador) {
            <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-edit-title">
              <div class="modal-card">
                <div class="modal-header">
                  <h2 id="modal-edit-title">✏️ Editar Jugador</h2>
                  <button class="btn-close" (click)="closeEditForm()" aria-label="Cerrar modal">✕</button>
                </div>
                
                <form (ngSubmit)="onSubmitEdit()">
                  <div class="modal-body">
                    @if (formError) {
                      <div class="alert alert-danger">
                        {{ formError }}
                      </div>
                    }

                    <div class="info-badge">
                      <p>Editando jugador: <strong>{{ editingJugador.nombre }} {{ editingJugador.apellido }}</strong></p>
                    </div>

                    <div class="foto-upload-section">
                      @if (fotoPreview) {
                        <img [src]="fotoPreview" class="foto-preview" alt="Preview">
                      } @else if (editingJugador.foto_url) {
                        <img [src]="getFotoUrl(editingJugador.foto_url)" class="foto-preview" alt="Foto actual">
                      } @else {
                        <div class="avatar-lg avatar-initials" [style.background-color]="getAvatarColor(editingJugador.nombre)">
                          {{ getInitials(editingJugador.nombre, editingJugador.apellido) }}
                        </div>
                      }
                      <button type="button" class="btn btn-secondary btn-sm" (click)="fotoInput.click()" [disabled]="subiendoFoto">
                        {{ subiendoFoto ? 'Subiendo...' : 'Cambiar foto' }}
                      </button>
                      <input #fotoInput type="file" accept="image/jpeg,image/png" (change)="onFotoSelected($event)" style="display:none">
                      @if (fotoPreview) {
                        <small class="foto-hint">La foto se guardará al guardar cambios</small>
                      }
                    </div>

                    <div class="form-section">
                      <h3>Datos Personales</h3>

                      <div class="form-row">
                        <div class="form-group">
                          <label for="edit-nombre">Nombre <span class="required">*</span></label>
                          <input
                            id="edit-nombre"
                            type="text"
                            [class]="'form-control' + ((formSubmitted || editFormTouched['nombre']) && !editJugadorData.nombre ? ' is-invalid' : '')"
                            [(ngModel)]="editJugadorData.nombre"
                            name="edit_nombre"
                            required
                            placeholder="Juan"
                            (blur)="touchEditField('nombre')"
                            [attr.aria-invalid]="(formSubmitted || editFormTouched['nombre']) && !editJugadorData.nombre"
                          />
                          @if ((formSubmitted || editFormTouched['nombre']) && !editJugadorData.nombre) {
                            <span class="field-error" role="alert">El nombre es obligatorio</span>
                          }
                        </div>

                        <div class="form-group">
                          <label for="edit-apellido">Apellido <span class="required">*</span></label>
                          <input
                            id="edit-apellido"
                            type="text"
                            [class]="'form-control' + ((formSubmitted || editFormTouched['apellido']) && !editJugadorData.apellido ? ' is-invalid' : '')"
                            [(ngModel)]="editJugadorData.apellido"
                            name="edit_apellido"
                            required
                            placeholder="Pérez García"
                            (blur)="touchEditField('apellido')"
                            [attr.aria-invalid]="(formSubmitted || editFormTouched['apellido']) && !editJugadorData.apellido"
                          />
                          @if ((formSubmitted || editFormTouched['apellido']) && !editJugadorData.apellido) {
                            <span class="field-error" role="alert">El apellido es obligatorio</span>
                          }
                        </div>
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label>Tipo Documento</label>
                          <select
                            class="form-control"
                            [(ngModel)]="editJugadorData.tipo_documento"
                            name="edit_tipo_documento"
                          >
                            <option value="CC">CC - Cédula de Ciudadanía</option>
                            <option value="TI">TI - Tarjeta de Identidad</option>
                            <option value="CE">CE - Cédula de Extranjería</option>
                            <option value="RC">RC - Registro Civil</option>
                            <option value="PA">PA - Pasaporte</option>
                          </select>
                        </div>

                        <div class="form-group">
                          <label for="edit-documento">Documento</label>
                          <input
                            id="edit-documento"
                            type="text"
                            class="form-control"
                            [(ngModel)]="editJugadorData.documento"
                            name="edit_documento"
                            placeholder="1234567890"
                            maxlength="15"
                          />
                        </div>
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label for="edit-fecha">Fecha de Nacimiento</label>
                          <input
                            id="edit-fecha"
                            type="date"
                            class="form-control"
                            [(ngModel)]="editJugadorData.fecha_nacimiento"
                            name="edit_fecha_nacimiento"
                          />
                        </div>

                        <div class="form-group">
                          <label for="edit-fecha-ingreso">Fecha de Ingreso al Equipo</label>
                          <input
                            id="edit-fecha-ingreso"
                            type="date"
                            class="form-control"
                            [(ngModel)]="editJugadorData.fecha_ingreso"
                            name="edit_fecha_ingreso"
                          />
                        </div>
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label>Posición</label>
                          <input
                            type="text"
                            class="form-control"
                            [(ngModel)]="editJugadorData.posicion"
                            name="edit_posicion"
                            placeholder="Delantero"
                          />
                        </div>
                      </div>
                    </div>

                    <div class="form-section">
                      <h3>Información de Contacto</h3>

                      <div class="form-row">
                        <div class="form-group">
                          <label for="edit-telefono">Teléfono</label>
                          <input
                            id="edit-telefono"
                            type="tel"
                            [class]="'form-control' + ((editFormTouched['telefono']) && editJugadorData.telefono && !isValidOptionalPhone(editJugadorData.telefono) ? ' is-invalid' : '')"
                            [(ngModel)]="editJugadorData.telefono"
                            name="edit_telefono"
                            placeholder="3001234567"
                            maxlength="15"
                            (blur)="touchEditField('telefono')"
                            [attr.aria-invalid]="(editFormTouched['telefono']) && editJugadorData.telefono && !isValidOptionalPhone(editJugadorData.telefono)"
                          />
                          @if ((editFormTouched['telefono']) && editJugadorData.telefono && !isValidOptionalPhone(editJugadorData.telefono)) {
                            <span class="field-error" role="alert">Ingrese un número válido (ej: 3001234567)</span>
                          }
                        </div>

                        <div class="form-group">
                          <label>Teléfono Acudiente</label>
                          <input
                            type="tel"
                            [class]="'form-control' + ((editFormTouched['telefono_acudiente']) && !isValidOptionalPhone(editJugadorData.telefono_acudiente) ? ' is-invalid' : '')"
                            [(ngModel)]="editJugadorData.telefono_acudiente"
                            name="edit_telefono_acudiente"
                            placeholder="3109876543"
                            maxlength="15"
                            (blur)="touchEditField('telefono_acudiente')"
                          />
                          @if ((editFormTouched['telefono_acudiente']) && editJugadorData.telefono_acudiente && !isValidOptionalPhone(editJugadorData.telefono_acudiente)) {
                            <span class="field-error" role="alert">Ingrese un número válido (ej: 3109876543)</span>
                          }
                        </div>
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            [class]="'form-control' + ((editFormTouched['email']) && !isValidEmail(editJugadorData.email) ? ' is-invalid' : '')"
                            [(ngModel)]="editJugadorData.email"
                            name="edit_email"
                            placeholder="jugador@example.com"
                            (blur)="touchEditField('email')"
                          />
                          @if ((editFormTouched['email']) && editJugadorData.email && !isValidEmail(editJugadorData.email)) {
                            <span class="field-error" role="alert">Ingrese un correo electrónico válido</span>
                          }
                        </div>

                        <div class="form-group">
                          <label>Email Acudiente</label>
                          <input
                            type="email"
                            [class]="'form-control' + ((editFormTouched['email_acudiente']) && !isValidEmail(editJugadorData.email_acudiente) ? ' is-invalid' : '')"
                            [(ngModel)]="editJugadorData.email_acudiente"
                            name="edit_email_acudiente"
                            placeholder="acudiente@example.com"
                            (blur)="touchEditField('email_acudiente')"
                          />
                          @if ((editFormTouched['email_acudiente']) && editJugadorData.email_acudiente && !isValidEmail(editJugadorData.email_acudiente)) {
                            <span class="field-error" role="alert">Ingrese un correo electrónico válido</span>
                          }
                        </div>
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label>Dirección</label>
                          <input
                            type="text"
                            class="form-control"
                            [(ngModel)]="editJugadorData.direccion"
                            name="edit_direccion"
                            placeholder="Calle 123 #45-67"
                          />
                        </div>
                      </div>
                    </div>

                    <div class="form-section">
                      <h3>Categoría</h3>

                      <div class="form-group">
                        <label for="edit-categoria">Categoría <span class="required">*</span></label>
                        <select
                          id="edit-categoria"
                          [class]="'form-control' + ((formSubmitted || editFormTouched['categoria_id']) && !(editJugadorData.categoria_id > 0) ? ' is-invalid' : '')"
                          [(ngModel)]="editJugadorData.categoria_id"
                          name="edit_categoria_id"
                          required
                          (blur)="touchEditField('categoria_id')"
                          [attr.aria-invalid]="(formSubmitted || editFormTouched['categoria_id']) && !(editJugadorData.categoria_id > 0)"
                        >
                          <option [ngValue]="0">Seleccione una categoría</option>
                          @for (cat of categorias; track cat.id) {
                            <option [ngValue]="cat.id">
                              {{ cat.nombre }} - \${{ formatNumber(cat.valor_mensualidad) }}/mes
                            </option>
                          }
                        </select>
                        @if ((formSubmitted || editFormTouched['categoria_id']) && !(editJugadorData.categoria_id > 0)) {
                          <span class="field-error" role="alert">Selecciona una categoría</span>
                        }

                        @if (selectedCategoriaEdit) {
                          <div class="categoria-info">
                            <p><strong>Mensualidad:</strong> \${{ formatNumber(selectedCategoriaEdit.valor_mensualidad) }}</p>
                            <p><strong>Descripción:</strong> {{ selectedCategoriaEdit.descripcion }}</p>
                          </div>
                        }
                      </div>
                    </div>

                    <div class="form-section">
                      <h3>Estado</h3>

                      <div class="form-group">
                        <label class="toggle-container">
                          <span class="toggle-label">Jugador Activo</span>
                          <div class="toggle-switch">
                            <input
                              type="checkbox"
                              [(ngModel)]="editJugadorData.activo"
                              name="edit_activo"
                            />
                            <span class="toggle-slider"></span>
                          </div>
                          <span [class]="editJugadorData.activo ? 'status-active' : 'status-inactive'">
                            {{ editJugadorData.activo ? 'Activo' : 'Inactivo' }}
                          </span>
                        </label>
                        <p class="toggle-hint">
                          Los jugadores inactivos no aparecerán en la generación de mensualidades
                        </p>
                      </div>
                    </div>

                    <div class="form-note">
                      <p><span class="required">*</span> Campos obligatorios</p>
                    </div>
                  </div>

                  <div class="modal-footer">
                    <button 
                      type="button" 
                      class="btn btn-secondary" 
                      (click)="closeEditForm()"
                      [disabled]="saving"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      class="btn btn-primary"
                      [disabled]="!isEditFormValid() || saving"
                    >
                      {{ saving ? 'Guardando...' : '✓ Guardar Cambios' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          }

          <!-- Modal Historial de Pagos -->
          @if (showHistorialModal && jugadorHistorial) {
            <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-historial-title">
              <div class="modal-card modal-historial">
                <div class="modal-header">
                  <h2 id="modal-historial-title">📋 Historial de Pagos</h2>
                  <button class="btn-close" (click)="closeHistorialModal()" aria-label="Cerrar historial">✕</button>
                </div>
                
                <div class="modal-body">
                  <!-- Información del jugador -->
                  <div class="jugador-info-card">
                    <div class="info-row" style="justify-content: center; border-bottom: none; padding-bottom: 0;">
                      @if (jugadorHistorial.foto_url) {
                        <img [src]="getFotoUrl(jugadorHistorial.foto_url)" class="avatar clickable" (click)="openFotoViewer(jugadorHistorial)" alt="Foto">
                      } @else {
                        <div class="avatar avatar-initials" [style.background-color]="getAvatarColor(jugadorHistorial.nombre)">
                          {{ getInitials(jugadorHistorial.nombre, jugadorHistorial.apellido) }}
                        </div>
                      }
                    </div>
                    <div class="info-row">
                      <span class="label">Jugador:</span>
                      <span class="value">{{ jugadorHistorial.nombre }} {{ jugadorHistorial.apellido }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Documento:</span>
                      <span class="value">{{ jugadorHistorial.documento }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Categoría:</span>
                      <span class="value">{{ jugadorHistorial.categoria.nombre }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Estado:</span>
                      <span [class]="jugadorHistorial.activo ? 'status-active' : 'status-inactive'">
                        {{ jugadorHistorial.activo ? '✓ Activo' : '✗ Inactivo' }}
                      </span>
                    </div>
                  </div>

                  <!-- Loading -->
                  @if (loadingHistorial) {
                    <div class="loading">
                      <p>🔄 Cargando historial de pagos...</p>
                    </div>
                  }

                  <!-- Error -->
                  @if (historialError) {
                    <div class="alert alert-danger">
                      {{ historialError }}
                    </div>
                  }

                  <!-- Historial de pagos -->
                  @if (!loadingHistorial && !historialError) {
                    @if (historialPagos.length === 0) {
                      <div class="empty-state">
                        <p>🔍 No se encontraron pagos para este jugador</p>
                        <small>El historial aparecerá aquí cuando se registren pagos</small>
                      </div>
                    } @else {
                      <div class="historial-list">
                        <h3>Pagos Registrados ({{ historialPagos.length }})</h3>
                        
                        @for (pago of historialPagos; track pago.id) {
                          <div class="historial-item" [class.pago-anulado]="pago.anulado">
                            <div class="pago-header">
                              <div class="pago-fecha">
                                <span class="fecha-icon">📅</span>
                                <span>{{ pago.fecha_pago | date: 'dd/MM/yyyy' }}</span>
                                @if (pago.anulado) {
                                  <span class="badge-anulado">Anulado</span>
                                }
                              </div>
                              <div class="pago-monto" [class.monto-anulado]="pago.anulado">
                                <strong>\${{ formatNumber(pago.monto_pagado) }}</strong>
                              </div>
                            </div>

                            <div class="pago-details">
                              <div class="detail-row">
                                <span class="detail-label">Periodo:</span>
                                <span class="detail-value">
                                  @if (pago.mensualidad) {
                                    {{ getMesNombre(pago.mensualidad.mes) }} {{ pago.mensualidad.anio }}
                                  } @else {
                                    N/A
                                  }
                                </span>
                              </div>

                              @if (pago.metodo_pago) {
                                <div class="detail-row">
                                  <span class="detail-label">Método:</span>
                                  <span class="detail-value">
                                    <span class="badge-metodo" [attr.data-metodo]="pago.metodo_pago">{{ pago.metodo_pago }}</span>
                                  </span>
                                </div>
                              }

                              @if (pago.numero_recibo) {
                                <div class="detail-row">
                                  <span class="detail-label">Recibo:</span>
                                  <span class="detail-value">{{ pago.numero_recibo }}</span>
                                </div>
                              }

                              @if (pago.observaciones) {
                                <div class="detail-row">
                                  <span class="detail-label">Observaciones:</span>
                                  <span class="detail-value">{{ pago.observaciones }}</span>
                                </div>
                              }

                              <div class="detail-row">
                                <span class="detail-label">Registrado por:</span>
                                <span class="detail-value">
                                  {{ pago.registrado_por?.nombre || 'Sistema' }}
                                </span>
                              </div>
                            </div>
                          </div>
                        }

                        <!-- Resumen total -->
                        <div class="historial-resumen">
                          <div class="resumen-item">
                            <span class="resumen-label">Total Pagado:</span>
                            <span class="resumen-value">\${{ formatNumber(getTotalPagado()) }}</span>
                          </div>
                        </div>
                      </div>
                    }
                  }
                </div>

                <div class="modal-footer">
                  <button 
                    type="button" 
                    class="btn btn-secondary" 
                    (click)="closeHistorialModal()"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          }
          <!-- Modal Importar Excel -->
          @if (showImportModal) {
            <div class="modal-overlay">
              <div class="modal-card modal-import">
                <div class="modal-header">
                  <h2>📥 Importar Jugadores desde Excel</h2>
                  <button class="btn-close" (click)="closeImportModal()">✕</button>
                </div>

                <div class="modal-body">
                  <!-- Stepper -->
                  <div class="import-stepper">
                    <div class="step" [class.active]="importStep === 1" [class.done]="importStep > 1">
                      <span class="step-number">{{ importStep > 1 ? '✓' : '1' }}</span>
                      <span class="step-label">Archivo</span>
                    </div>
                    <div class="step-line" [class.active]="importStep > 1"></div>
                    <div class="step" [class.active]="importStep === 2" [class.done]="importStep > 2">
                      <span class="step-number">{{ importStep > 2 ? '✓' : '2' }}</span>
                      <span class="step-label">Preview</span>
                    </div>
                    <div class="step-line" [class.active]="importStep > 2"></div>
                    <div class="step" [class.active]="importStep === 3">
                      <span class="step-number">3</span>
                      <span class="step-label">Resultados</span>
                    </div>
                  </div>

                  <!-- Paso 1: Seleccion de archivo -->
                  @if (importStep === 1) {
                    <div class="import-step-content">
                      <div class="import-actions-row">
                        <button class="btn btn-secondary" (click)="downloadPlantilla()" [disabled]="downloadingPlantilla">
                          {{ downloadingPlantilla ? 'Descargando...' : '📄 Descargar Plantilla' }}
                        </button>
                        <small class="import-hint">Descarga la plantilla con las categorias actualizadas</small>
                      </div>

                      <div
                        class="drop-zone"
                        [class.drag-over]="isDragOver"
                        (dragover)="onDragOver($event)"
                        (dragleave)="onDragLeave($event)"
                        (drop)="onDrop($event)"
                        (click)="importFileInput.click()"
                      >
                        <div class="drop-zone-content">
                          <span class="drop-icon">📁</span>
                          <p><strong>Arrastra tu archivo Excel aqui</strong></p>
                          <p class="drop-hint">o haz clic para seleccionar</p>
                          <small class="drop-limits">Formato: .xlsx | Max: 5MB | Max: 500 filas</small>
                        </div>
                      </div>
                      <input
                        #importFileInput
                        type="file"
                        accept=".xlsx,.xls"
                        (change)="onExcelFileSelected($event)"
                        style="display:none"
                      >

                      @if (importFileError) {
                        <div class="alert alert-danger">
                          {{ importFileError }}
                        </div>
                      }
                    </div>
                  }

                  <!-- Paso 2: Preview -->
                  @if (importStep === 2) {
                    <div class="import-step-content">
                      <div class="import-summary-bar">
                        <span class="summary-item summary-ok">✓ Validos: {{ getValidCount() }}</span>
                        <span class="summary-item summary-err">✗ Con errores: {{ getErrorCount() }}</span>
                        <span class="summary-item summary-total">Total: {{ importPreviewData.length }}</span>
                      </div>

                      <div class="table-container import-preview-table">
                        <table>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Estado</th>
                              <th>Nombre</th>
                              <th>Apellido</th>
                              <th>Tipo Doc.</th>
                              <th>Documento</th>
                              <th>Fecha Nac.</th>
                              <th>Telefono</th>
                              <th>Tel. Acudiente</th>
                              <th>Categoria</th>
                              <th>Posicion</th>
                              <th>Error</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (row of importPreviewData; track row.fila) {
                              <tr [class.row-error]="row.error" [class.row-ok]="!row.error">
                                <td>{{ row.fila }}</td>
                                <td>
                                  @if (row.error) {
                                    <span class="status-badge status-error">✗</span>
                                  } @else {
                                    <span class="status-badge status-success">✓</span>
                                  }
                                </td>
                                <td>{{ row.nombre }}</td>
                                <td>{{ row.apellido }}</td>
                                <td>{{ row.tipo_documento || 'CC' }}</td>
                                <td>{{ row.documento }}</td>
                                <td>{{ row.fecha_nacimiento }}</td>
                                <td>{{ row.telefono }}</td>
                                <td>{{ row.telefono_acudiente || '' }}</td>
                                <td>{{ row.categoria }}</td>
                                <td>{{ row.posicion || '' }}</td>
                                <td class="error-cell">{{ row.error || '' }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }

                  <!-- Paso 3: Resultados -->
                  @if (importStep === 3) {
                    <div class="import-step-content">
                      @if (importLoading) {
                        <div class="loading">
                          <p>Importando jugadores...</p>
                        </div>
                      } @else if (importResult) {
                        <div class="result-cards">
                          <div class="result-card result-success">
                            <span class="result-number">{{ importResult.exitosos }}</span>
                            <span class="result-label">Importados</span>
                          </div>
                          <div class="result-card result-error">
                            <span class="result-number">{{ importResult.fallidos }}</span>
                            <span class="result-label">Errores</span>
                          </div>
                          <div class="result-card result-total">
                            <span class="result-number">{{ importResult.total_procesados }}</span>
                            <span class="result-label">Total</span>
                          </div>
                        </div>

                        @if (importResult.errores && importResult.errores.length > 0) {
                          <div class="import-errors-detail">
                            <h4>Detalle de errores:</h4>
                            <div class="table-container">
                              <table>
                                <thead>
                                  <tr>
                                    <th>Fila</th>
                                    <th>Documento</th>
                                    <th>Nombre</th>
                                    <th>Error</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (err of importResult.errores; track err.fila) {
                                    <tr>
                                      <td>{{ err.fila }}</td>
                                      <td>{{ err.documento }}</td>
                                      <td>{{ err.nombre }}</td>
                                      <td class="error-cell">{{ err.error }}</td>
                                    </tr>
                                  }
                                </tbody>
                              </table>
                            </div>
                          </div>
                        }
                      }
                    </div>
                  }
                </div>

                <div class="modal-footer">
                  @if (importStep === 1) {
                    <button class="btn btn-secondary" (click)="closeImportModal()">Cancelar</button>
                  }
                  @if (importStep === 2) {
                    <button class="btn btn-secondary" (click)="importStep = 1">← Volver</button>
                    <button
                      class="btn btn-primary"
                      (click)="executeImport()"
                      [disabled]="getValidCount() === 0"
                    >
                      Importar {{ getValidCount() }} jugadores
                    </button>
                  }
                  @if (importStep === 3 && !importLoading) {
                    <button class="btn btn-primary" (click)="closeImportModal()">Cerrar</button>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Lightbox foto -->
          @if (fotoViewerUrl) {
            <div class="foto-viewer-overlay" (click)="closeFotoViewer()">
              <div class="foto-viewer-content" (click)="$event.stopPropagation()">
                <button class="foto-viewer-close" (click)="closeFotoViewer()">✕</button>
                <img [src]="fotoViewerUrl" class="foto-viewer-img" alt="Foto del jugador">
                @if (fotoViewerNombre) {
                  <p class="foto-viewer-nombre">{{ fotoViewerNombre }}</p>
                }
              </div>
            </div>
          }

          <!-- Modal Reenviar Notificaciones -->
          @if (showReenviarModal) {
            <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-reenviar-title">
              <div class="modal-content modal-small">
                <div class="modal-header">
                  <h2 id="modal-reenviar-title">Enviar notificaciones</h2>
                </div>
                <div class="modal-body">
                  <p>Se registró el correo <strong>{{ reenviarEmail }}</strong>.</p>
                  <p>¿Deseas enviar las notificaciones de las mensualidades pendientes a este correo?</p>
                </div>
                <div class="form-footer">
                  <button type="button" class="btn btn-secondary" (click)="cancelarReenviar()" [disabled]="reenviando">
                    Ahora no
                  </button>
                  <button type="button" class="btn btn-primary" (click)="confirmarReenviar()" [disabled]="reenviando">
                    {{ reenviando ? 'Enviando...' : 'Sí, enviar' }}
                  </button>
                </div>
              </div>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styleUrl: './jugadores.component.css'
})
export class JugadoresComponent implements OnInit, CanComponentDeactivate {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  permisosService = inject(PermisosService);

  jugadores: Jugador[] = [];
  categorias: Categoria[] = [];
  loading = true;
  error = '';
  showNewForm = false;
  showEditForm = false;
  saving = false;
  formError = '';
  successMessage = '';
  formSubmitted = false;
  newFormTouched: Record<string, boolean> = {};
  editFormTouched: Record<string, boolean> = {};
  private filterTimeout: any;

  // Nuevo jugador
  newJugador: CreateJugadorDto = {
    nombre: '',
    apellido: '',
    tipo_documento: 'CC',
    documento: '',
    fecha_nacimiento: '',
    fecha_ingreso: '',
    telefono: '',
    telefono_acudiente: '',
    email: '',
    email_acudiente: '',
    direccion: '',
    categoria_id: 0,
    posicion: ''
  };

  // Jugador a editar
  editingJugador: Jugador | null = null;  // Nuevo
  editJugadorData: any = {};  // Nuevo

  // Filtros
  filters = {
    search: '',
    categoria_id: null as number | null,  // Cambiado de categoriaId a categoria_id
    activo: null as boolean | null
  };

  // Paginación
  currentPage = 1;
  pageSize = 10;
  totalJugadores = 0;
  totalPages = 0;

  // Modal historial
  showHistorialModal = false;
  jugadorHistorial: Jugador | null = null;
  historialPagos: any[] = [];
  loadingHistorial = false;
  historialError = '';

  // Escaneo de documento con IA
  escaneando = false;
  scanSuccess = false;
  scanError = '';
  scanQuotaExceeded = false;
  scanApiKeyError = false;

  // Foto de perfil
  fotoFile: File | null = null;
  fotoPreview: string | null = null;
  subiendoFoto = false;
  apiBaseUrl = '';

  // Foto viewer
  fotoViewerUrl: string | null = null;
  fotoViewerNombre: string | null = null;

  // Reenviar notificaciones
  showReenviarModal = false;
  reenviarJugadorId: number | null = null;
  reenviarEmail = '';
  reenviando = false;

  // Import Excel
  showImportModal = false;
  importStep = 1;
  importPreviewData: any[] = [];
  importResult: any = null;
  importLoading = false;
  importFileError = '';
  isDragOver = false;
  downloadingPlantilla = false;

  // Detección de duplicados al registrar
  jugadoresSimilares: any[] = [];
  private rawSimilares: any[] = [];
  buscandoSimilares = false;
  advertenciaIgnorada = false;
  private similaresTimeout: any;

  ngOnInit() {
    this.apiBaseUrl = this.api.getBaseUrl();
    this.loadCategorias();
    this.loadJugadores();
  }

  loadCategorias() {
    this.api.get<Categoria[]>('categorias/active').subscribe({
      next: (data) => {
        this.categorias = data;
        console.log('Categorías cargadas:', data);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.formError = 'Error al cargar las categorías';
      }
    });
  }

  loadJugadores() {
    this.loading = true;
    this.error = '';

    // Asegurar que currentPage tiene un valor válido
    if (!this.currentPage || this.currentPage < 1) {
      this.currentPage = 1;
    }

    let endpoint = `jugadores?page=${this.currentPage}&limit=${this.pageSize}`;
    
    if (this.filters.search) {
      endpoint += `&search=${encodeURIComponent(this.filters.search)}`;
    }
    if (this.filters.categoria_id !== null && this.filters.categoria_id !== undefined) {
      endpoint += `&categoria_id=${this.filters.categoria_id}`;
    }
    if (this.filters.activo !== null && this.filters.activo !== undefined) {
      endpoint += `&activo=${this.filters.activo}`;
      console.log('Filtro activo aplicado:', this.filters.activo);
    }

    console.log('Cargando jugadores con endpoint:', endpoint);
    console.log('Filtros actuales:', this.filters);

    this.api.get<PaginatedResponse>(endpoint).subscribe({
      next: (response) => {
        this.jugadores = response.data;
        this.totalJugadores = response.meta.total;
        this.totalPages = response.meta.totalPages;
        this.currentPage = response.meta.page;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los jugadores';
        this.loading = false;
        console.error('Error loading jugadores:', err);
      }
    });
  }

  hasUnsavedChanges(): boolean {
    if (this.showNewForm) {
      return !!(this.newJugador.nombre || this.newJugador.apellido || this.newJugador.documento);
    }
    if (this.showEditForm) {
      return true;
    }
    return false;
  }

  onFilterChange() {
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadJugadores();
    }, 300);
  }

  clearFilters() {
    this.filters = {
      search: '',
      categoria_id: null,
      activo: null
    };
    this.currentPage = 1;
    this.loadJugadores();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadJugadores();
    }
  }

  openNewForm() {
    this.showNewForm = true;
    this.formError = '';
    this.formSubmitted = false;
    this.resetForm();
  }

  touchNewField(field: string) { this.newFormTouched[field] = true; }
  touchEditField(field: string) { this.editFormTouched[field] = true; }

  closeNewForm() {
    this.showNewForm = false;
    this.formError = '';
    this.formSubmitted = false;
    this.newFormTouched = {};
    this.escaneando = false;
    this.scanSuccess = false;
    this.scanError = '';
    this.scanQuotaExceeded = false;
    this.scanApiKeyError = false;
    this.jugadoresSimilares = [];
    this.rawSimilares = [];
    this.buscandoSimilares = false;
    this.advertenciaIgnorada = false;
    clearTimeout(this.similaresTimeout);
    this.resetForm();
  }

  onDocScanSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    input.value = '';

    this.escaneando = true;
    this.scanError = '';
    this.scanSuccess = false;
    this.scanQuotaExceeded = false;
    this.scanApiKeyError = false;

    const formData = new FormData();
    formData.append('imagen', file);

    this.api.postFile<any>('jugadores/extraer-documento', formData).subscribe({
      next: (res) => {
        const data = res.data || res;
        if (data.nombre)           this.newJugador.nombre = data.nombre;
        if (data.apellido)         this.newJugador.apellido = data.apellido;
        if (data.tipo_documento)   this.newJugador.tipo_documento = data.tipo_documento;
        if (data.documento)        this.newJugador.documento = data.documento;
        if (data.fecha_nacimiento) this.newJugador.fecha_nacimiento = data.fecha_nacimiento;
        this.escaneando = false;
        this.scanSuccess = true;
      },
      error: (err) => {
        this.escaneando = false;
        if (err.status === 429) {
          this.scanQuotaExceeded = true;
          this.scanApiKeyError = false;
          this.scanError = '';
        } else if (err.status === 503) {
          this.scanApiKeyError = true;
          this.scanQuotaExceeded = false;
          this.scanError = '';
        } else {
          this.scanError = err.error?.message || 'No se pudo extraer la información del documento';
          this.scanQuotaExceeded = false;
          this.scanApiKeyError = false;
        }
      },
    });
  }

  resetForm() {
    this.newJugador = {
      nombre: '',
      apellido: '',
      tipo_documento: 'CC',
      documento: '',
      fecha_nacimiento: '',
      fecha_ingreso: '',
      telefono: '',
      telefono_acudiente: '',
      email: '',
      email_acudiente: '',
      direccion: '',
      categoria_id: 0,
      posicion: ''
    };
    this.fotoFile = null;
    this.fotoPreview = null;
    this.jugadoresSimilares = [];
    this.rawSimilares = [];
    this.buscandoSimilares = false;
    this.advertenciaIgnorada = false;
    clearTimeout(this.similaresTimeout);
  }

  onApellidoChange() {
    this.advertenciaIgnorada = false;
    clearTimeout(this.similaresTimeout);
    const apellido = this.newJugador.apellido?.trim() ?? '';
    if (apellido.length < 3) {
      this.jugadoresSimilares = [];
      this.rawSimilares = [];
      this.buscandoSimilares = false;
      return;
    }
    this.buscandoSimilares = true;
    this.similaresTimeout = setTimeout(() => this.buscarSimilares(apellido), 500);
  }

  private buscarSimilares(apellido: string) {
    this.api.get<any>(`jugadores?search=${encodeURIComponent(apellido)}&limit=5&page=1`).subscribe({
      next: (res) => {
        this.rawSimilares = res?.data ?? [];
        this.filtrarSimilares();
        this.buscandoSimilares = false;
      },
      error: () => {
        this.rawSimilares = [];
        this.jugadoresSimilares = [];
        this.buscandoSimilares = false;
      },
    });
  }

  private normalizar(str: string): string {
    return (str ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  private filtrarSimilares() {
    const nombre = this.normalizar(this.newJugador.nombre ?? '');
    if (nombre.length < 2) {
      this.jugadoresSimilares = [...this.rawSimilares];
      return;
    }
    this.jugadoresSimilares = this.rawSimilares.filter(j =>
      this.normalizar(j.nombre).includes(nombre)
    );
  }

  onNombreChange() {
    this.advertenciaIgnorada = false;
    this.filtrarSimilares();
  }

  ignorarSimilares() {
    this.advertenciaIgnorada = true;
  }

  // Valida número colombiano: 7-10 dígitos, opcionalmente con +57
  isValidPhone(phone: string): boolean {
    if (!phone) return false;
    return /^(\+57[\s-]?)?[1-9]\d{6,9}$/.test(phone.trim());
  }

  // Para campos opcionales: vacío es válido, pero si hay algo debe tener formato correcto
  isValidOptionalPhone(phone: string): boolean {
    if (!phone || !phone.trim()) return true;
    return /^(\+57[\s-]?)?[1-9]\d{6,9}$/.test(phone.trim());
  }

  isValidEmail(email: string): boolean {
    if (!email || !email.trim()) return true;
    return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
  }

  isFormValid(): boolean {
    return !!(
      this.newJugador.nombre &&
      this.newJugador.apellido &&
      this.isValidOptionalPhone(this.newJugador.telefono) &&
      this.isValidOptionalPhone(this.newJugador.telefono_acudiente) &&
      this.isValidEmail(this.newJugador.email) &&
      this.isValidEmail(this.newJugador.email_acudiente) &&
      this.newJugador.categoria_id > 0
    );
  }

  onSubmit() {
    this.formSubmitted = true;
    if (!this.isFormValid()) {
      this.formError = 'Por favor complete todos los campos obligatorios';
      return;
    }

    this.saving = true;
    this.formError = '';

    // Convertir fecha a formato ISO 8601 (agregar la hora)
    const jugadorData = {
      ...this.newJugador,
      fecha_nacimiento: this.newJugador.fecha_nacimiento ? this.newJugador.fecha_nacimiento + 'T00:00:00.000Z' : undefined,
      fecha_ingreso: this.newJugador.fecha_ingreso ? this.newJugador.fecha_ingreso + 'T00:00:00.000Z' : undefined,
      email: this.newJugador.email || undefined,
      email_acudiente: this.newJugador.email_acudiente || undefined,
    };

    console.log('Enviando jugador:', jugadorData);

    this.api.post<any>('jugadores', jugadorData).subscribe({
      next: (response) => {
        const jugador = response.data || response;
        const jugadorId = jugador.id;

        // Si hay foto seleccionada, subirla
        if (this.fotoFile && jugadorId) {
          this.subiendoFoto = true;
          const formData = new FormData();
          formData.append('foto', this.fotoFile);

          this.api.postFile(`jugadores/${jugadorId}/foto`, formData).subscribe({
            next: () => {
              this.subiendoFoto = false;
              this.saving = false;
              this.showNewForm = false;
              this.toast.success(`Jugador ${jugador.nombre} ${jugador.apellido} creado exitosamente`);
              this.currentPage = 1;
              this.loadJugadores();
              this.resetForm();
            },
            error: () => {
              this.subiendoFoto = false;
              this.saving = false;
              this.showNewForm = false;
              this.toast.warning(`Jugador creado, pero hubo un error al subir la foto`);
              this.currentPage = 1;
              this.loadJugadores();
              this.resetForm();
            }
          });
        } else {
          this.saving = false;
          this.showNewForm = false;
          this.toast.success(`Jugador ${jugador.nombre} ${jugador.apellido} creado exitosamente`);
          this.currentPage = 1;
          this.loadJugadores();
          this.resetForm();
        }
      },
      error: (err) => {
        this.saving = false;
        console.error('Error completo:', err);
        console.error('Error response:', err.error);

        // Mostrar mensaje de error más específico
        if (err.error?.message) {
          if (Array.isArray(err.error.message)) {
            this.formError = err.error.message.join(', ');
          } else {
            this.formError = err.error.message;
          }
        } else {
          this.formError = 'Error al crear el jugador. Verifique que el documento no esté duplicado.';
        }
      }
    });
  }

  get selectedCategoria(): Categoria | undefined {
    return this.categorias.find(c => c.id === this.newJugador.categoria_id);
  }

  get selectedCategoriaEdit(): Categoria | undefined {
    return this.categorias.find(c => c.id === this.editJugadorData.categoria_id);
  }

  openEditForm(jugador: Jugador) {
    this.editingJugador = jugador;
    this.editJugadorData = {
      nombre: jugador.nombre,
      apellido: jugador.apellido,
      tipo_documento: jugador.tipo_documento || 'CC',
      documento: jugador.documento,
      fecha_nacimiento: jugador.fecha_nacimiento ? jugador.fecha_nacimiento.toString().split('T')[0] : '',
      fecha_ingreso: jugador.fecha_ingreso ? jugador.fecha_ingreso.toString().split('T')[0] : '',
      posicion: jugador.posicion || '',
      telefono: jugador.telefono,
      telefono_acudiente: jugador.telefono_acudiente || '',
      email: jugador.email || '',
      email_acudiente: jugador.email_acudiente || '',
      direccion: jugador.direccion || '',
      categoria_id: jugador.categoria.id,
      activo: jugador.activo
    };
    this.showEditForm = true;
    this.formError = '';
    this.fotoFile = null;
    this.fotoPreview = null;
  }

  closeEditForm() {
    this.showEditForm = false;
    this.editingJugador = null;
    this.editJugadorData = {};
    this.editFormTouched = {};
    this.formError = '';
    this.fotoFile = null;
    this.fotoPreview = null;
  }

  isEditFormValid(): boolean {
    return !!(
      this.editJugadorData.nombre &&
      this.editJugadorData.apellido &&
      this.isValidOptionalPhone(this.editJugadorData.telefono) &&
      this.isValidOptionalPhone(this.editJugadorData.telefono_acudiente) &&
      this.isValidEmail(this.editJugadorData.email) &&
      this.isValidEmail(this.editJugadorData.email_acudiente) &&
      this.editJugadorData.categoria_id > 0
    );
  }

  onSubmitEdit() {
    this.formSubmitted = true;
    if (!this.isEditFormValid() || !this.editingJugador) {
      this.formError = 'Por favor complete todos los campos obligatorios';
      return;
    }

    this.saving = true;
    this.formError = '';

    // Convertir fecha a formato ISO 8601
    const dataToSend = {
      ...this.editJugadorData,
      fecha_nacimiento: this.editJugadorData.fecha_nacimiento ? this.editJugadorData.fecha_nacimiento + 'T00:00:00.000Z' : undefined,
      fecha_ingreso: this.editJugadorData.fecha_ingreso ? this.editJugadorData.fecha_ingreso + 'T00:00:00.000Z' : undefined,
      email: this.editJugadorData.email || undefined,
      email_acudiente: this.editJugadorData.email_acudiente || undefined,
    };

    console.log('Actualizando jugador:', dataToSend);

    const jugadorId = this.editingJugador.id;
    const teniaCorreo = !!(this.editingJugador.email || this.editingJugador.email_acudiente);
    const ahoraTieneCorreo = !!(dataToSend.email || dataToSend.email_acudiente);

    this.api.patch<any>(`jugadores/${jugadorId}`, dataToSend).subscribe({
      next: (response) => {
        const jugador = response.data || response;

        const ofrecerReenvio = !teniaCorreo && ahoraTieneCorreo;
        if (ofrecerReenvio) {
          this.reenviarJugadorId = jugadorId;
          this.reenviarEmail = dataToSend.email || dataToSend.email_acudiente || '';
          this.showReenviarModal = true;
        }

        // Si hay foto nueva, subirla
        if (this.fotoFile) {
          this.subiendoFoto = true;
          const formData = new FormData();
          formData.append('foto', this.fotoFile);

          this.api.postFile(`jugadores/${jugadorId}/foto`, formData).subscribe({
            next: () => {
              this.subiendoFoto = false;
              this.saving = false;
              this.toast.success(`Jugador ${jugador.nombre} ${jugador.apellido} actualizado exitosamente`);
              this.showEditForm = false;
              this.closeEditForm();
              if (!this.currentPage || this.currentPage < 1) this.currentPage = 1;
              this.loadJugadores();
            },
            error: () => {
              this.subiendoFoto = false;
              this.saving = false;
              this.toast.warning(`Jugador actualizado, pero hubo un error al subir la foto`);
              this.showEditForm = false;
              this.closeEditForm();
              this.loadJugadores();
            }
          });
        } else {
          this.saving = false;
          this.toast.success(`Jugador ${jugador.nombre} ${jugador.apellido} actualizado exitosamente`);
          this.showEditForm = false;
          this.closeEditForm();
          if (!this.currentPage || this.currentPage < 1) this.currentPage = 1;
          this.loadJugadores();
        }
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'Error al actualizar el jugador';
        console.error('Error updating jugador:', err);
      }
    });
  }

  confirmarReenviar() {
    if (!this.reenviarJugadorId) return;
    this.reenviando = true;
    this.api.post<any>(`jugadores/${this.reenviarJugadorId}/reenviar-notificaciones`, {}).subscribe({
      next: (res) => {
        this.reenviando = false;
        this.showReenviarModal = false;
        const data = res.data || res;
        if (data.enviadas > 0) {
          this.toast.success(`Se enviaron ${data.enviadas} notificaciones al correo registrado`);
        } else {
          this.toast.info('No hay mensualidades pendientes para notificar');
        }
        this.reenviarJugadorId = null;
        this.reenviarEmail = '';
      },
      error: () => {
        this.reenviando = false;
        this.showReenviarModal = false;
        this.toast.error('Error al enviar las notificaciones');
      },
    });
  }

  cancelarReenviar() {
    this.showReenviarModal = false;
    this.reenviarJugadorId = null;
    this.reenviarEmail = '';
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-CO').format(num);
  }

  // Ver historial de pagos
  verHistorial(jugador: Jugador) {
    console.log('📋 Abriendo historial de jugador:', jugador.nombre, jugador.apellido);
    this.jugadorHistorial = jugador;
    this.showHistorialModal = true;
    this.loadHistorialPagos(jugador.id);
  }

  loadHistorialPagos(jugadorId: number) {
    this.loadingHistorial = true;
    this.historialError = '';
    this.historialPagos = [];

    this.api.get<any>(`jugadores/${jugadorId}/historial-pagos`).subscribe({
      next: (response) => {
        this.historialPagos = response.historial_pagos || [];
        this.loadingHistorial = false;
      },
      error: (err) => {
        this.loadingHistorial = false;
        if (err.status === 404) {
          this.historialPagos = [];
        } else {
          this.historialError = 'Error al cargar el historial de pagos';
        }
      }
    });
  }

  closeHistorialModal() {
    this.showHistorialModal = false;
    this.jugadorHistorial = null;
    this.historialPagos = [];
    this.historialError = '';
  }

  getTotalPagado(): number {
    return this.historialPagos
      .filter(p => !p.anulado)
      .reduce((total, pago) => total + Number(pago.monto_pagado), 0);
  }

  // Foto helpers
  getFotoUrl(fotoUrl: string): string {
    return `${this.apiBaseUrl}${fotoUrl}`;
  }

  irAPagos(jugador: Jugador) {
    if (!this.permisosService.canView('pagos')) return;
    this.router.navigate(['/pagos'], { queryParams: { jugadorId: jugador.id } });
  }

  getEstadoPago(jugador: Jugador): { texto: string; clase: string } {
    const mensualidades = jugador.mensualidades || [];
    if (mensualidades.length === 0) {
      return { texto: 'Al día', clase: 'pago-aldia' };
    }

    const hoy = new Date();
    const tieneVencidas = mensualidades.some(
      m => m.estado !== 'pagado' && new Date(m.fecha_vencimiento) < hoy
    );
    if (tieneVencidas) {
      return { texto: 'Debe', clase: 'pago-debe' };
    }

    const tienePendientes = mensualidades.some(m => m.estado !== 'pagado');
    if (tienePendientes) {
      return { texto: 'Pendiente', clase: 'pago-pendiente' };
    }

    return { texto: 'Al día', clase: 'pago-aldia' };
  }

  getInitials(nombre: string, apellido: string): string {
    return (nombre?.charAt(0) || '').toUpperCase() + (apellido?.charAt(0) || '').toUpperCase();
  }

  getAvatarColor(nombre: string): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    let hash = 0;
    for (let i = 0; i < (nombre || '').length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  onFotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.formError = 'La foto no puede superar 2MB';
        return;
      }
      this.fotoFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.fotoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  openFotoViewer(jugador: Jugador) {
    if (jugador.foto_url) {
      this.fotoViewerUrl = this.getFotoUrl(jugador.foto_url);
      this.fotoViewerNombre = `${jugador.nombre} ${jugador.apellido}`;
    }
  }

  closeFotoViewer() {
    this.fotoViewerUrl = null;
    this.fotoViewerNombre = null;
  }

  getMesNombre(mes: number): string {
    const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes] || `Mes ${mes}`;
  }

  // === Import Excel Methods ===

  openImportModal() {
    this.showImportModal = true;
    this.importStep = 1;
    this.importPreviewData = [];
    this.importResult = null;
    this.importFileError = '';
    this.importLoading = false;
  }

  closeImportModal() {
    const hadImports = this.importResult?.exitosos > 0;
    this.showImportModal = false;
    this.importStep = 1;
    this.importPreviewData = [];
    this.importResult = null;
    this.importFileError = '';
    if (hadImports) {
      this.loadJugadores();
    }
  }

  downloadPlantilla() {
    this.downloadingPlantilla = true;
    this.api.getBlob('jugadores/plantilla-excel').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_jugadores.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloadingPlantilla = false;
      },
      error: (err) => {
        console.error('Error descargando plantilla:', err);
        this.importFileError = 'Error al descargar la plantilla';
        this.downloadingPlantilla = false;
      }
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processExcelFile(files[0]);
    }
  }

  onExcelFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processExcelFile(input.files[0]);
      input.value = '';
    }
  }

  private processExcelFile(file: File) {
    this.importFileError = '';

    // Validar tipo
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      this.importFileError = 'Solo se permiten archivos .xlsx o .xls';
      return;
    }

    // Validar tamano
    if (file.size > 5 * 1024 * 1024) {
      this.importFileError = 'El archivo no puede superar 5MB';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (jsonData.length < 2) {
          this.importFileError = 'El archivo no contiene datos (solo headers o esta vacio)';
          return;
        }

        // Normalizar headers
        const headers = (jsonData[0] as string[]).map((h: string) =>
          String(h).replace(/\*/g, '').trim().toLowerCase()
        );

        const expectedHeaders = ['nombre', 'apellido', 'documento', 'fecha_nacimiento', 'telefono', 'categoria'];
        const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          this.importFileError = `Faltan columnas obligatorias: ${missingHeaders.join(', ')}`;
          return;
        }

        // Mapear datos
        const rows = jsonData.slice(1).filter((row: any[]) =>
          row.some((cell: any) => String(cell).trim() !== '')
        );

        if (rows.length > 500) {
          this.importFileError = `El archivo tiene ${rows.length} filas. El maximo es 500.`;
          return;
        }

        const categoriasNombres = new Set(this.categorias.map(c => c.nombre.toLowerCase().trim()));
        const documentosEnArchivo = new Set<string>();

        this.importPreviewData = rows.map((row: any[], index: number) => {
          const obj: any = { fila: index + 2 };

          headers.forEach((header: string, colIndex: number) => {
            obj[header] = String(row[colIndex] ?? '').trim();
          });

          // Pre-validar
          const errors: string[] = [];
          if (!obj.nombre) errors.push('Nombre vacio');
          if (!obj.apellido) errors.push('Apellido vacio');
          if (!obj.documento) errors.push('Documento vacio');
          if (!obj.fecha_nacimiento) errors.push('Fecha nacimiento vacia');
          if (!obj.telefono) errors.push('Telefono vacio');
          if (!obj.categoria) errors.push('Categoria vacia');

          if (obj.categoria && !categoriasNombres.has(obj.categoria.toLowerCase().trim())) {
            errors.push(`Categoria "${obj.categoria}" no existe`);
          }

          if (obj.documento && documentosEnArchivo.has(obj.documento)) {
            errors.push('Documento duplicado en archivo');
          }

          if (obj.documento) {
            documentosEnArchivo.add(obj.documento);
          }

          obj.error = errors.length > 0 ? errors.join('; ') : '';
          return obj;
        });

        this.importStep = 2;
      } catch (err) {
        console.error('Error al parsear Excel:', err);
        this.importFileError = 'Error al leer el archivo. Verifique que sea un Excel valido.';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  getValidCount(): number {
    return this.importPreviewData.filter(r => !r.error).length;
  }

  getErrorCount(): number {
    return this.importPreviewData.filter(r => r.error).length;
  }

  executeImport() {
    const validRows = this.importPreviewData
      .filter(r => !r.error)
      .map(r => ({
        nombre: r.nombre,
        apellido: r.apellido,
        documento: r.documento,
        fecha_nacimiento: r.fecha_nacimiento,
        telefono: r.telefono,
        categoria: r.categoria,
        email: r.email || undefined,
        email_acudiente: r.email_acudiente || undefined,
        direccion: r.direccion || undefined,
        tipo_documento: r.tipo_documento || undefined,
        telefono_acudiente: r.telefono_acudiente || undefined,
        posicion: r.posicion || undefined,
      }));

    if (validRows.length === 0) return;

    this.importLoading = true;
    this.importStep = 3;

    this.api.post<any>('jugadores/bulk-import', { jugadores: validRows }).subscribe({
      next: (response) => {
        this.importResult = response;
        this.importLoading = false;
        if (response.exitosos > 0) {
          this.successMessage = `Se importaron ${response.exitosos} jugadores exitosamente`;
          setTimeout(() => { this.successMessage = ''; }, 5000);
        }
      },
      error: (err) => {
        console.error('Error en importacion:', err);
        this.importResult = {
          total_procesados: validRows.length,
          exitosos: 0,
          fallidos: validRows.length,
          errores: [{ fila: 0, documento: '', nombre: '', error: err.error?.message || 'Error del servidor' }]
        };
        this.importLoading = false;
      }
    });
  }
}
