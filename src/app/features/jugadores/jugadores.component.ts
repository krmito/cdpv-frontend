import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ApiService } from '../../core/services/api.service';
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

interface Jugador {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  fecha_nacimiento: string;
  telefono: string;
  email: string;
  direccion: string;
  categoria: Categoria;
  activo: boolean;
  fecha_registro: string;
  foto_url?: string;
}

interface PaginatedResponse {
  data: Jugador[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CreateJugadorDto {
  nombre: string;              // Nombre
  apellido: string;            // Apellido
  documento: string;
  fecha_nacimiento: string;    // ISO string
  telefono: string;            // Obligatorio
  email?: string;              // Opcional
  direccion?: string;          // Opcional
  categoria_id: number;
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
            <button class="btn btn-success btn-new" (click)="openImportModal()">
              <span>📥</span> Importar Excel
            </button>
            <button class="btn btn-primary btn-new" (click)="openNewForm()">
              <span>➕</span> Nuevo Jugador
            </button>
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

          <!-- Loading -->
          @if (loading) {
            <div class="loading">
              <p>Cargando jugadores...</p>
            </div>
          }

          <!-- Error -->
          @if (error) {
            <div class="alert alert-danger">
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
                  <p>No se encontraron jugadores</p>
                  <button class="btn btn-primary" (click)="openNewForm()">
                    ➕ Agregar Primer Jugador
                  </button>
                </div>
              } @else {
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Foto</th>
                        <th>Documento</th>
                        <th>Nombre Completo</th>
                        <th>Categoría</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (jugador of jugadores; track jugador.id) {
                        <tr>
                          <td>
                            @if (jugador.foto_url) {
                              <img [src]="getFotoUrl(jugador.foto_url)" class="avatar-sm clickable" (click)="openFotoViewer(jugador)" alt="Foto">
                            } @else {
                              <div class="avatar-sm avatar-initials" [style.background-color]="getAvatarColor(jugador.nombre)">
                                {{ getInitials(jugador.nombre, jugador.apellido) }}
                              </div>
                            }
                          </td>
                          <td><strong>{{ jugador.documento }}</strong></td>
                          <td>{{ jugador.nombre }} {{ jugador.apellido }}</td>
                          <td>
                            <span class="categoria-badge">
                              {{ jugador.categoria.nombre }}
                            </span>
                          </td>
                          <td>{{ jugador.telefono || 'N/A' }}</td>
                          <td>{{ jugador.email || 'N/A' }}</td>
                          <td>
                            <span [class]="jugador.activo ? 'status-active' : 'status-inactive'">
                              {{ jugador.activo ? '✓ Activo' : '✗ Inactivo' }}
                            </span>
                          </td>
                          <td>
                            <div class="action-buttons">
                              <button class="btn-icon" (click)="verHistorial(jugador)" title="Ver Historial">
                                📋
                              </button>
                              <button class="btn-icon" (click)="openEditForm(jugador)" title="Editar">
                                ✏️
                              </button>
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
            <div class="modal-overlay">
              <div class="modal-card">
                <div class="modal-header">
                  <h2>➕ Nuevo Jugador</h2>
                  <button class="btn-close" (click)="closeNewForm()">✕</button>
                </div>
                
                <form (ngSubmit)="onSubmit()">
                  <div class="modal-body">
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

                    <div class="form-section">
                      <h3>Datos Personales</h3>
                      
                      <div class="form-row">
                        <div class="form-group">
                          <label>Nombre <span class="required">*</span></label>
                          <input
                            type="text"
                            class="form-control"
                            [(ngModel)]="newJugador.nombre"
                            name="nombre"
                            required
                            placeholder="Juan"
                          />
                        </div>

                        <div class="form-group">
                          <label>Apellido <span class="required">*</span></label>
                          <input
                            type="text"
                            class="form-control"
                            [(ngModel)]="newJugador.apellido"
                            name="apellido"
                            required
                            placeholder="Pérez García"
                          />
                        </div>
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label>Documento <span class="required">*</span></label>
                          <input
                            type="text"
                            class="form-control"
                            [(ngModel)]="newJugador.documento"
                            name="documento"
                            required
                            placeholder="1234567890"
                            maxlength="15"
                          />
                        </div>

                        <div class="form-group">
                          <label>Fecha de Nacimiento <span class="required">*</span></label>
                          <input
                            type="date"
                            class="form-control"
                            [(ngModel)]="newJugador.fecha_nacimiento"
                            name="fecha_nacimiento"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div class="form-section">
                      <h3>Información de Contacto</h3>
                      
                      <div class="form-group">
                        <label>Teléfono <span class="required">*</span></label>
                        <input
                          type="tel"
                          class="form-control"
                          [(ngModel)]="newJugador.telefono"
                          name="telefono"
                          required
                          placeholder="3001234567"
                          maxlength="15"
                        />
                      </div>

                      <div class="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          class="form-control"
                          [(ngModel)]="newJugador.email"
                          name="email"
                          placeholder="jugador@example.com"
                        />
                      </div>

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

                    <div class="form-section">
                      <h3>Categoría</h3>
                      
                      <div class="form-group">
                        <label>Categoría <span class="required">*</span></label>
                        <select
                          class="form-control"
                          [(ngModel)]="newJugador.categoria_id"
                          name="categoria_id"
                          required
                        >
                          <option [ngValue]="0">Seleccione una categoría</option>
                          @for (cat of categorias; track cat.id) {
                            <option [ngValue]="cat.id">
                              {{ cat.nombre }} - \${{ formatNumber(cat.valor_mensualidad) }}/mes
                            </option>
                          }
                        </select>
                        
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
                      [disabled]="!isFormValid() || saving"
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
            <div class="modal-overlay">
              <div class="modal-card">
                <div class="modal-header">
                  <h2>✏️ Editar Jugador</h2>
                  <button class="btn-close" (click)="closeEditForm()">✕</button>
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
                          <label>Nombre <span class="required">*</span></label>
                          <input
                            type="text"
                            class="form-control"
                            [(ngModel)]="editJugadorData.nombre"
                            name="edit_nombre"
                            required
                            placeholder="Juan"
                          />
                        </div>

                        <div class="form-group">
                          <label>Apellido <span class="required">*</span></label>
                          <input
                            type="text"
                            class="form-control"
                            [(ngModel)]="editJugadorData.apellido"
                            name="edit_apellido"
                            required
                            placeholder="Pérez García"
                          />
                        </div>
                      </div>

                      <div class="form-row">
                        <div class="form-group">
                          <label>Documento <span class="required">*</span></label>
                          <input
                            type="text"
                            class="form-control"
                            [(ngModel)]="editJugadorData.documento"
                            name="edit_documento"
                            required
                            placeholder="1234567890"
                            maxlength="15"
                          />
                        </div>

                        <div class="form-group">
                          <label>Fecha de Nacimiento <span class="required">*</span></label>
                          <input
                            type="date"
                            class="form-control"
                            [(ngModel)]="editJugadorData.fecha_nacimiento"
                            name="edit_fecha_nacimiento"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div class="form-section">
                      <h3>Información de Contacto</h3>
                      
                      <div class="form-group">
                        <label>Teléfono <span class="required">*</span></label>
                        <input
                          type="tel"
                          class="form-control"
                          [(ngModel)]="editJugadorData.telefono"
                          name="edit_telefono"
                          required
                          placeholder="3001234567"
                          maxlength="15"
                        />
                      </div>

                      <div class="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          class="form-control"
                          [(ngModel)]="editJugadorData.email"
                          name="edit_email"
                          placeholder="jugador@example.com"
                        />
                      </div>

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

                    <div class="form-section">
                      <h3>Categoría</h3>

                      <div class="form-group">
                        <label>Categoría <span class="required">*</span></label>
                        <select
                          class="form-control"
                          [(ngModel)]="editJugadorData.categoria_id"
                          name="edit_categoria_id"
                          required
                        >
                          <option [ngValue]="0">Seleccione una categoría</option>
                          @for (cat of categorias; track cat.id) {
                            <option [ngValue]="cat.id">
                              {{ cat.nombre }} - \${{ formatNumber(cat.valor_mensualidad) }}/mes
                            </option>
                          }
                        </select>

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
            <div class="modal-overlay">
              <div class="modal-card modal-historial">
                <div class="modal-header">
                  <h2>📋 Historial de Pagos</h2>
                  <button class="btn-close" (click)="closeHistorialModal()">✕</button>
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
                              <th>Documento</th>
                              <th>Fecha Nac.</th>
                              <th>Telefono</th>
                              <th>Categoria</th>
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
                                <td>{{ row.documento }}</td>
                                <td>{{ row.fecha_nacimiento }}</td>
                                <td>{{ row.telefono }}</td>
                                <td>{{ row.categoria }}</td>
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
        </main>
      </div>
    </div>
  `,
  styles: [`
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
      padding: 32px;
      overflow-y: auto;
      background: #f5f7fa;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0;
      color: #111827;
      font-size: 32px;
    }
    .filters-card {
      margin-bottom: 24px;
    }
    .filters-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr auto;
      gap: 16px;
      align-items: end;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .table-header h3 {
      margin: 0;
      color: #111827;
    }
    .table-header .badge {
      background: #dbeafe;
      color: #1e40af;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead {
      background: #f9fafb;
    }
    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #1f2937;
    }
    tbody tr:hover {
      background: #f9fafb;
    }
    .categoria-badge {
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-active {
      color: #10b981;
      font-weight: 600;
    }
    .status-inactive {
      color: #ef4444;
      font-weight: 600;
    }
    .action-buttons {
      display: flex;
      gap: 8px;
    }
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 4px;
      transition: transform 0.2s;
    }
    .btn-icon:hover {
      transform: scale(1.2);
    }
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .page-info {
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
    }
    .loading {
      text-align: center;
      padding: 60px;
      color: #6b7280;
    }
    .empty-state {
      text-align: center;
      padding: 60px;
      color: #6b7280;
    }
    .empty-state p {
      margin-bottom: 20px;
      font-size: 16px;
    }
    .btn-secondary {
      background: #6b7280;
      color: white;
    }
    .btn-secondary:hover {
      background: #4b5563;
    }
    
    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-card {
      background: white;
      border-radius: 12px;
      max-width: 700px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
    }
    .modal-header h2 {
      margin: 0;
      color: #111827;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
    }
    .btn-close:hover {
      background: #f3f4f6;
    }
    .modal-body {
      padding: 24px;
    }
    .modal-footer {
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .form-section {
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    .form-section:last-of-type {
      border-bottom: none;
    }
    .form-section h3 {
      margin: 0 0 16px 0;
      color: #374151;
      font-size: 16px;
      font-weight: 600;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .required {
      color: #ef4444;
    }
    .form-note {
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
      margin-top: 16px;
    }
    .form-note p {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }
    .categoria-info {
      margin-top: 12px;
      padding: 12px;
      background: #f0f9ff;
      border-left: 3px solid #3b82f6;
      border-radius: 4px;
    }
    .categoria-info p {
      margin: 4px 0;
      font-size: 13px;
      color: #1e40af;
    }
    .info-badge {
      background: #e0f2fe;
      border-left: 4px solid #0284c7;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .info-badge p {
      margin: 0;
      color: #0c4a6e;
      font-size: 14px;
    }
    
    /* Modal Historial */
    .modal-historial {
      max-width: 800px;
    }
    .jugador-info-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-row .label {
      font-weight: 600;
      color: #6b7280;
    }
    .info-row .value {
      color: #111827;
    }
    .historial-list h3 {
      margin: 0 0 16px 0;
      color: #374151;
      font-size: 18px;
      font-weight: 600;
    }
    .historial-item {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      transition: box-shadow 0.2s;
    }
    .historial-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .pago-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .pago-fecha {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #6b7280;
    }
    .fecha-icon {
      font-size: 16px;
    }
    .pago-monto {
      font-size: 20px;
      color: #10b981;
    }
    .pago-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .detail-row {
      display: flex;
      gap: 8px;
      font-size: 14px;
    }
    .detail-label {
      color: #6b7280;
      font-weight: 500;
      min-width: 120px;
    }
    .detail-value {
      color: #111827;
      flex: 1;
    }
    .detail-value small {
      color: #9ca3af;
      font-size: 12px;
    }
    .historial-resumen {
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }
    .resumen-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .resumen-label {
      font-weight: 600;
      color: #374151;
      font-size: 16px;
    }
    .resumen-value {
      font-size: 24px;
      font-weight: 700;
      color: #10b981;
    }

    /* Toggle Switch */
    .toggle-container {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }
    .toggle-label {
      font-weight: 500;
      color: #374151;
    }
    .toggle-switch {
      position: relative;
      width: 48px;
      height: 24px;
    }
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #cbd5e1;
      transition: 0.3s;
      border-radius: 24px;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .toggle-switch input:checked + .toggle-slider {
      background-color: #10b981;
    }
    .toggle-switch input:checked + .toggle-slider:before {
      transform: translateX(24px);
    }
    .toggle-hint {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #6b7280;
    }

    /* Avatares */
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      overflow: hidden;
    }
    .avatar-sm {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      overflow: hidden;
    }
    .avatar-lg {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      overflow: hidden;
    }
    .avatar-initials {
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
    }
    .avatar-lg.avatar-initials {
      font-size: 28px;
    }

    /* Foto upload */
    .foto-upload-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 20px;
      margin-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    .foto-preview {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #3b82f6;
    }
    .foto-hint {
      color: #6b7280;
      font-size: 12px;
    }
    .btn-sm {
      padding: 6px 14px;
      font-size: 13px;
    }

    /* Badges pago */
    .badge-anulado {
      background: #fef2f2;
      color: #dc2626;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }
    .pago-anulado {
      opacity: 0.7;
      border-left: 3px solid #dc2626;
    }
    .monto-anulado {
      color: #dc2626 !important;
      text-decoration: line-through;
    }
    .badge-metodo {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }
    .badge-metodo[data-metodo="efectivo"] {
      background: #dcfce7;
      color: #166534;
    }
    .badge-metodo[data-metodo="nequi"] {
      background: #e8d5f5;
      color: #6b21a8;
    }
    .badge-metodo[data-metodo="transferencia"] {
      background: #dbeafe;
      color: #1e40af;
    }
    .badge-metodo[data-metodo="otro"] {
      background: #f3f4f6;
      color: #374151;
    }

    /* Clickable photos */
    .clickable {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .clickable:hover {
      transform: scale(1.15);
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    /* Foto viewer lightbox */
    .foto-viewer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.2s ease;
    }
    .foto-viewer-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      text-align: center;
    }
    .foto-viewer-img {
      max-width: 500px;
      max-height: 500px;
      width: auto;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      object-fit: contain;
    }
    .foto-viewer-close {
      position: absolute;
      top: -12px;
      right: -12px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: white;
      border: none;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      z-index: 1;
    }
    .foto-viewer-close:hover {
      background: #f3f4f6;
    }
    .foto-viewer-nombre {
      color: white;
      margin-top: 12px;
      font-size: 16px;
      font-weight: 500;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Import Modal */
    .btn-success {
      background: #10b981;
      color: white;
    }
    .btn-success:hover {
      background: #059669;
    }
    .header-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .btn-new {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .modal-import {
      max-width: 900px;
    }

    /* Stepper */
    .import-stepper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      margin-bottom: 24px;
      padding: 16px 0;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #e5e7eb;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }
    .step.active .step-number {
      background: #3b82f6;
      color: white;
    }
    .step.done .step-number {
      background: #10b981;
      color: white;
    }
    .step-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
    .step.active .step-label {
      color: #3b82f6;
      font-weight: 600;
    }
    .step-line {
      width: 60px;
      height: 2px;
      background: #e5e7eb;
      margin: 0 8px;
      margin-bottom: 18px;
    }
    .step-line.active {
      background: #10b981;
    }

    /* Drop zone */
    .import-actions-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .import-hint {
      color: #6b7280;
      font-size: 13px;
    }
    .drop-zone {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      background: #fafbfc;
    }
    .drop-zone:hover {
      border-color: #3b82f6;
      background: #f0f7ff;
    }
    .drop-zone.drag-over {
      border-color: #3b82f6;
      background: #dbeafe;
    }
    .drop-zone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .drop-icon {
      font-size: 36px;
      margin-bottom: 8px;
    }
    .drop-zone-content p {
      margin: 0;
      color: #374151;
    }
    .drop-hint {
      color: #9ca3af !important;
      font-size: 14px;
    }
    .drop-limits {
      color: #9ca3af;
      font-size: 12px;
      margin-top: 8px;
    }

    /* Preview table */
    .import-summary-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .summary-item {
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
    }
    .summary-ok {
      background: #dcfce7;
      color: #166534;
    }
    .summary-err {
      background: #fef2f2;
      color: #991b1b;
    }
    .summary-total {
      background: #f3f4f6;
      color: #374151;
    }
    .import-preview-table {
      max-height: 400px;
      overflow-y: auto;
    }
    .import-preview-table table {
      font-size: 13px;
    }
    .import-preview-table th {
      font-size: 11px;
      padding: 8px 10px;
      position: sticky;
      top: 0;
      background: #f9fafb;
      z-index: 1;
    }
    .import-preview-table td {
      padding: 8px 10px;
    }
    .row-error {
      background: #fef2f2 !important;
    }
    .row-ok {
      background: #f0fdf4;
    }
    .row-ok:hover {
      background: #dcfce7 !important;
    }
    .status-badge {
      display: inline-flex;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }
    .status-success {
      background: #dcfce7;
      color: #166534;
    }
    .status-error {
      background: #fef2f2;
      color: #991b1b;
    }
    .error-cell {
      color: #dc2626;
      font-size: 12px;
      max-width: 200px;
    }

    /* Result cards */
    .result-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .result-card {
      text-align: center;
      padding: 24px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .result-number {
      font-size: 36px;
      font-weight: 700;
    }
    .result-label {
      font-size: 14px;
      font-weight: 500;
    }
    .result-success {
      background: #dcfce7;
      color: #166534;
    }
    .result-error {
      background: #fef2f2;
      color: #991b1b;
    }
    .result-total {
      background: #f3f4f6;
      color: #374151;
    }
    .import-errors-detail h4 {
      margin: 0 0 12px 0;
      color: #991b1b;
    }
    .import-step-content {
      min-height: 200px;
    }
  `]
})
export class JugadoresComponent implements OnInit {
  private api = inject(ApiService);

  jugadores: Jugador[] = [];
  categorias: Categoria[] = [];
  loading = true;
  error = '';
  showNewForm = false;
  showEditForm = false;  // Nuevo
  saving = false;
  formError = '';
  successMessage = '';

  // Nuevo jugador
  newJugador: CreateJugadorDto = {
    nombre: '',
    apellido: '',
    documento: '',
    fecha_nacimiento: '',
    telefono: '',
    email: '',
    direccion: '',
    categoria_id: 0
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

  // Foto de perfil
  fotoFile: File | null = null;
  fotoPreview: string | null = null;
  subiendoFoto = false;
  apiBaseUrl = '';

  // Foto viewer
  fotoViewerUrl: string | null = null;
  fotoViewerNombre: string | null = null;

  // Import Excel
  showImportModal = false;
  importStep = 1;
  importPreviewData: any[] = [];
  importResult: any = null;
  importLoading = false;
  importFileError = '';
  isDragOver = false;
  downloadingPlantilla = false;

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
        this.totalJugadores = response.total;
        this.totalPages = response.totalPages;
        this.currentPage = response.page;
        this.loading = false;
        console.log('Jugadores cargados:', response.data.length, 'de', response.total);
      },
      error: (err) => {
        this.error = 'Error al cargar los jugadores';
        this.loading = false;
        console.error('Error loading jugadores:', err);
      }
    });
  }

  onFilterChange() {
    console.log('Filtro cambiado. Filtros actuales:', this.filters);
    this.currentPage = 1;
    this.loadJugadores();
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
    this.resetForm();
  }

  closeNewForm() {
    this.showNewForm = false;
    this.formError = '';
    this.resetForm();
  }

  resetForm() {
    this.newJugador = {
      nombre: '',
      apellido: '',
      documento: '',
      fecha_nacimiento: '',
      telefono: '',
      email: '',
      direccion: '',
      categoria_id: 0
    };
    this.fotoFile = null;
    this.fotoPreview = null;
  }

  isFormValid(): boolean {
    return !!(
      this.newJugador.nombre &&
      this.newJugador.apellido &&
      this.newJugador.documento &&
      this.newJugador.fecha_nacimiento &&
      this.newJugador.telefono &&
      this.newJugador.categoria_id > 0
    );
  }

  onSubmit() {
    if (!this.isFormValid()) {
      this.formError = 'Por favor complete todos los campos obligatorios';
      return;
    }

    this.saving = true;
    this.formError = '';

    // Convertir fecha a formato ISO 8601 (agregar la hora)
    const jugadorData = {
      ...this.newJugador,
      fecha_nacimiento: this.newJugador.fecha_nacimiento + 'T00:00:00.000Z'
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
              this.successMessage = `Jugador ${jugador.nombre} ${jugador.apellido} creado exitosamente`;
              setTimeout(() => { this.successMessage = ''; }, 5000);
              this.currentPage = 1;
              this.loadJugadores();
              this.resetForm();
            },
            error: () => {
              this.subiendoFoto = false;
              this.saving = false;
              this.showNewForm = false;
              this.successMessage = `Jugador creado, pero hubo un error al subir la foto`;
              setTimeout(() => { this.successMessage = ''; }, 5000);
              this.currentPage = 1;
              this.loadJugadores();
              this.resetForm();
            }
          });
        } else {
          this.saving = false;
          this.showNewForm = false;
          this.successMessage = `Jugador ${jugador.nombre} ${jugador.apellido} creado exitosamente`;
          setTimeout(() => { this.successMessage = ''; }, 5000);
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
      documento: jugador.documento,
      fecha_nacimiento: jugador.fecha_nacimiento.toString().split('T')[0], // Convertir a YYYY-MM-DD
      telefono: jugador.telefono,
      email: jugador.email || '',
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
    this.formError = '';
    this.fotoFile = null;
    this.fotoPreview = null;
  }

  isEditFormValid(): boolean {
    return !!(
      this.editJugadorData.nombre &&
      this.editJugadorData.apellido &&
      this.editJugadorData.documento &&
      this.editJugadorData.fecha_nacimiento &&
      this.editJugadorData.telefono &&
      this.editJugadorData.categoria_id > 0
    );
  }

  onSubmitEdit() {
    if (!this.isEditFormValid() || !this.editingJugador) {
      this.formError = 'Por favor complete todos los campos obligatorios';
      return;
    }

    this.saving = true;
    this.formError = '';

    // Convertir fecha a formato ISO 8601
    const dataToSend = {
      ...this.editJugadorData,
      fecha_nacimiento: this.editJugadorData.fecha_nacimiento + 'T00:00:00.000Z'
    };

    console.log('Actualizando jugador:', dataToSend);

    const jugadorId = this.editingJugador.id;

    this.api.patch<any>(`jugadores/${jugadorId}`, dataToSend).subscribe({
      next: (response) => {
        const jugador = response.data || response;

        // Si hay foto nueva, subirla
        if (this.fotoFile) {
          this.subiendoFoto = true;
          const formData = new FormData();
          formData.append('foto', this.fotoFile);

          this.api.postFile(`jugadores/${jugadorId}/foto`, formData).subscribe({
            next: () => {
              this.subiendoFoto = false;
              this.saving = false;
              this.successMessage = `Jugador ${jugador.nombre} ${jugador.apellido} actualizado exitosamente`;
              this.showEditForm = false;
              this.closeEditForm();
              if (!this.currentPage || this.currentPage < 1) this.currentPage = 1;
              this.loadJugadores();
              setTimeout(() => { this.successMessage = ''; }, 5000);
            },
            error: (err) => {
              this.subiendoFoto = false;
              this.saving = false;
              // Datos guardados pero foto falló
              this.successMessage = `Jugador actualizado, pero hubo un error al subir la foto`;
              this.showEditForm = false;
              this.closeEditForm();
              this.loadJugadores();
              setTimeout(() => { this.successMessage = ''; }, 5000);
            }
          });
        } else {
          this.saving = false;
          this.successMessage = `Jugador ${jugador.nombre} ${jugador.apellido} actualizado exitosamente`;
          this.showEditForm = false;
          this.closeEditForm();
          if (!this.currentPage || this.currentPage < 1) this.currentPage = 1;
          this.loadJugadores();
          setTimeout(() => { this.successMessage = ''; }, 5000);
        }
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'Error al actualizar el jugador';
        console.error('Error updating jugador:', err);
      }
    });
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
        direccion: r.direccion || undefined,
        tipo_documento: r.tipo_documento || undefined,
        telefono_acudiente: r.telefono_acudiente || undefined,
        posicion: r.posicion || undefined,
        talla_camisa: r.talla_camisa || undefined,
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
