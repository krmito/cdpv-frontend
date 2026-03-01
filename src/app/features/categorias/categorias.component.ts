import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  edad_minima: number | null;
  edad_maxima: number | null;
  valor_mensualidad: number;
  activo: boolean;
}

interface CreateCategoriaDto {
  nombre: string;
  valor_mensualidad: number;
  edad_minima?: number;
  edad_maxima?: number;
  descripcion?: string;
  activo?: boolean;
}

interface PaginatedResponse {
  data: Categoria[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent, PageHeaderComponent],
  template: `
    <div class="layout">
      <app-navbar/>
      <div class="main-container">
        <app-sidebar/>
        <main class="content">
          <app-page-header
            title="Categorías"
            subtitle="Administra las categorías del club"
            icon="📁"
          />
          <div class="header-actions">
            @if (permisosService.canCreate('categorias')) {
              <button class="btn btn-primary btn-new" (click)="openNewForm()">
                <span>➕</span> Nueva Categoría
              </button>
            }
          </div>

          <!-- Mensaje de exito -->
          @if (successMessage) {
            <div class="alert alert-success">
              {{ successMessage }}
            </div>
          }

          <!-- Error -->
          @if (error) {
            <div class="alert alert-danger">
              {{ error }}
            </div>
          }

          <!-- Skeleton loader -->
          @if (loading) {
            <div class="card skeleton-card" aria-busy="true" aria-label="Cargando categorías">
              <div class="skeleton-header">
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-badge"></div>
              </div>
              @for (i of [1,2,3,4]; track i) {
                <div class="skeleton-row">
                  <div class="skeleton-line skeleton-md"></div>
                  <div class="skeleton-line skeleton-sm"></div>
                  <div class="skeleton-line skeleton-sm"></div>
                  <div class="skeleton-line skeleton-lg"></div>
                  <div class="skeleton-line skeleton-xs"></div>
                  <div class="skeleton-line skeleton-xs"></div>
                </div>
              }
            </div>
          }

          <!-- Tabla de Categorias -->
          @if (!loading && !error) {
            <div class="card">
              <div class="table-header">
                <h3>Lista de Categorías</h3>
                <span class="badge">{{ categorias.length }} categorías</span>
              </div>

              @if (categorias.length === 0) {
                <div class="empty-state">
                  <span class="empty-icon">📁</span>
                  <h4>No hay categorías registradas</h4>
                  <p>Crea la primera categoría para empezar a organizar a los jugadores</p>
                  @if (permisosService.canCreate('categorias')) {
                    <button class="btn btn-primary" (click)="openNewForm()" aria-label="Crear primera categoría">
                      ➕ Crear Primera Categoría
                    </button>
                  }
                </div>
              } @else {
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Rango de Edad</th>
                        <th>Mensualidad</th>
                        <th>Descripcion</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (categoria of categorias; track categoria.id) {
                        <tr>
                          <td><strong>{{ categoria.nombre }}</strong></td>
                          <td>
                            @if (categoria.edad_minima !== null && categoria.edad_maxima !== null) {
                              {{ categoria.edad_minima }} - {{ categoria.edad_maxima }} anos
                            } @else if (categoria.edad_minima !== null) {
                              Desde {{ categoria.edad_minima }} anos
                            } @else if (categoria.edad_maxima !== null) {
                              Hasta {{ categoria.edad_maxima }} anos
                            } @else {
                              Sin restriccion
                            }
                          </td>
                          <td class="monto">
                            \${{ formatNumber(categoria.valor_mensualidad) }}
                          </td>
                          <td>{{ categoria.descripcion || '-' }}</td>
                          <td>
                            <span [class]="categoria.activo ? 'status-active' : 'status-inactive'">
                              {{ categoria.activo ? 'Activa' : 'Inactiva' }}
                            </span>
                          </td>
                          <td>
                            <div class="action-buttons">
                              @if (permisosService.canEdit('categorias')) {
                                <button class="btn-icon" (click)="openEditForm(categoria)" title="Editar" [attr.aria-label]="'Editar categoría ' + categoria.nombre">
                                  ✏️
                                </button>
                                <button
                                  class="btn-icon"
                                  (click)="toggleActive(categoria)"
                                  [title]="categoria.activo ? 'Desactivar' : 'Activar'"
                                  [attr.aria-label]="(categoria.activo ? 'Desactivar' : 'Activar') + ' categoría ' + categoria.nombre"
                                >
                                  {{ categoria.activo ? '🔴' : '🟢' }}
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

          <!-- Modal Nueva Categoria -->
          @if (showNewForm) {
            <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-new-cat-title">
              <div class="modal-card">
                <div class="modal-header">
                  <h2 id="modal-new-cat-title">➕ Nueva Categoría</h2>
                  <button class="btn-close" (click)="closeNewForm()" aria-label="Cerrar modal">✕</button>
                </div>

                <form (ngSubmit)="onSubmit()">
                  <div class="modal-body">
                    @if (formError) {
                      <div class="alert alert-danger" role="alert">
                        {{ formError }}
                      </div>
                    }

                    <div class="form-group">
                      <label for="new-cat-nombre">Nombre <span class="required">*</span></label>
                      <input
                        id="new-cat-nombre"
                        type="text"
                        [class]="'form-control' + (formSubmitted && !newCategoria.nombre ? ' is-invalid' : '')"
                        [(ngModel)]="newCategoria.nombre"
                        name="nombre"
                        required
                        placeholder="Ej: Pre-infantil, Infantil, Juvenil..."
                        [attr.aria-invalid]="formSubmitted && !newCategoria.nombre"
                        aria-describedby="new-cat-nombre-error"
                      />
                      @if (formSubmitted && !newCategoria.nombre) {
                        <span id="new-cat-nombre-error" class="field-error" role="alert">El nombre es obligatorio</span>
                      }
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label>Edad Minima</label>
                        <input
                          type="number"
                          class="form-control"
                          [(ngModel)]="newCategoria.edad_minima"
                          name="edad_minima"
                          min="0"
                          placeholder="Ej: 5"
                        />
                      </div>

                      <div class="form-group">
                        <label>Edad Maxima</label>
                        <input
                          type="number"
                          class="form-control"
                          [(ngModel)]="newCategoria.edad_maxima"
                          name="edad_maxima"
                          min="0"
                          placeholder="Ej: 8"
                        />
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="new-cat-monto">Valor Mensualidad <span class="required">*</span></label>
                      <div class="input-with-prefix">
                        <span class="prefix">$</span>
                        <input
                          id="new-cat-monto"
                          type="number"
                          [class]="'form-control' + (formSubmitted && !(newCategoria.valor_mensualidad > 0) ? ' is-invalid' : '')"
                          [(ngModel)]="newCategoria.valor_mensualidad"
                          name="valor_mensualidad"
                          required
                          min="0"
                          placeholder="40000"
                          [attr.aria-invalid]="formSubmitted && !(newCategoria.valor_mensualidad > 0)"
                          aria-describedby="new-cat-monto-error"
                        />
                      </div>
                      @if (formSubmitted && !(newCategoria.valor_mensualidad > 0)) {
                        <span id="new-cat-monto-error" class="field-error" role="alert">El valor de mensualidad es obligatorio</span>
                      }
                    </div>

                    <div class="form-group">
                      <label for="new-cat-desc">Descripción</label>
                      <textarea
                        id="new-cat-desc"
                        class="form-control"
                        [(ngModel)]="newCategoria.descripcion"
                        name="descripcion"
                        rows="3"
                        placeholder="Descripción de la categoría..."
                      ></textarea>
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
                      {{ saving ? 'Guardando...' : 'Guardar Categoría' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          }

          <!-- Modal Editar Categoria -->
          @if (showEditForm && editingCategoria) {
            <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-edit-cat-title">
              <div class="modal-card">
                <div class="modal-header">
                  <h2 id="modal-edit-cat-title">✏️ Editar Categoría</h2>
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
                      <p>Editando: <strong>{{ editingCategoria.nombre }}</strong></p>
                    </div>

                    <div class="form-group">
                      <label>Nombre <span class="required">*</span></label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="editCategoriaData.nombre"
                        name="edit_nombre"
                        required
                        placeholder="Ej: Pre-infantil, Infantil, Juvenil..."
                      />
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label>Edad Minima</label>
                        <input
                          type="number"
                          class="form-control"
                          [(ngModel)]="editCategoriaData.edad_minima"
                          name="edit_edad_minima"
                          min="0"
                          placeholder="Ej: 5"
                        />
                      </div>

                      <div class="form-group">
                        <label>Edad Maxima</label>
                        <input
                          type="number"
                          class="form-control"
                          [(ngModel)]="editCategoriaData.edad_maxima"
                          name="edit_edad_maxima"
                          min="0"
                          placeholder="Ej: 8"
                        />
                      </div>
                    </div>

                    <div class="form-group">
                      <label>Valor Mensualidad <span class="required">*</span></label>
                      <div class="input-with-prefix">
                        <span class="prefix">$</span>
                        <input
                          type="number"
                          class="form-control"
                          [(ngModel)]="editCategoriaData.valor_mensualidad"
                          name="edit_valor_mensualidad"
                          required
                          min="0"
                          placeholder="40000"
                        />
                      </div>
                    </div>

                    <div class="form-group">
                      <label>Descripcion</label>
                      <textarea
                        class="form-control"
                        [(ngModel)]="editCategoriaData.descripcion"
                        name="edit_descripcion"
                        rows="3"
                        placeholder="Descripcion de la categoria..."
                      ></textarea>
                    </div>

                    <div class="form-group">
                      <label class="toggle-container">
                        <span class="toggle-label">Categoria Activa</span>
                        <div class="toggle-switch">
                          <input
                            type="checkbox"
                            [(ngModel)]="editCategoriaData.activo"
                            name="edit_activo"
                          />
                          <span class="toggle-slider"></span>
                        </div>
                        <span [class]="editCategoriaData.activo ? 'status-active' : 'status-inactive'">
                          {{ editCategoriaData.activo ? 'Activa' : 'Inactiva' }}
                        </span>
                      </label>
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
                      {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styleUrl: './categorias.component.css'
})
export class CategoriasComponent implements OnInit, CanComponentDeactivate {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  permisosService = inject(PermisosService);

  categorias: Categoria[] = [];
  loading = true;
  error = '';
  successMessage = '';
  showNewForm = false;
  showEditForm = false;
  saving = false;
  formError = '';
  formSubmitted = false;

  // Nueva categoria
  newCategoria: CreateCategoriaDto = {
    nombre: '',
    valor_mensualidad: 0,
    edad_minima: undefined,
    edad_maxima: undefined,
    descripcion: ''
  };

  // Categoria a editar
  editingCategoria: Categoria | null = null;
  editCategoriaData: any = {};

  ngOnInit() {
    this.loadCategorias();
  }

  loadCategorias() {
    this.loading = true;
    this.error = '';

    this.api.get<PaginatedResponse>('categorias?limit=100').subscribe({
      next: (response) => {
        this.categorias = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las categorias';
        this.loading = false;
        console.error('Error loading categorias:', err);
      }
    });
  }

  hasUnsavedChanges(): boolean {
    if (this.showNewForm) return !!(this.newCategoria.nombre || this.newCategoria.valor_mensualidad > 0);
    if (this.showEditForm) return true;
    return false;
  }

  openNewForm() {
    this.showNewForm = true;
    this.formError = '';
    this.formSubmitted = false;
    this.resetForm();
  }

  closeNewForm() {
    this.showNewForm = false;
    this.formError = '';
    this.formSubmitted = false;
    this.resetForm();
  }

  resetForm() {
    this.newCategoria = {
      nombre: '',
      valor_mensualidad: 0,
      edad_minima: undefined,
      edad_maxima: undefined,
      descripcion: ''
    };
  }

  isFormValid(): boolean {
    return !!(
      this.newCategoria.nombre &&
      this.newCategoria.valor_mensualidad > 0
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

    const dataToSend: any = {
      nombre: this.newCategoria.nombre,
      valor_mensualidad: this.newCategoria.valor_mensualidad
    };

    if (this.newCategoria.edad_minima) dataToSend.edad_minima = this.newCategoria.edad_minima;
    if (this.newCategoria.edad_maxima) dataToSend.edad_maxima = this.newCategoria.edad_maxima;
    if (this.newCategoria.descripcion) dataToSend.descripcion = this.newCategoria.descripcion;

    this.api.post<any>('categorias', dataToSend).subscribe({
      next: (response) => {
        this.saving = false;
        this.showNewForm = false;
        this.toast.success(`Categoría "${response.data?.nombre || response.nombre}" creada exitosamente`);
        this.loadCategorias();
        this.resetForm();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'Error al crear la categoría';
      }
    });
  }

  openEditForm(categoria: Categoria) {
    this.editingCategoria = categoria;
    this.editCategoriaData = {
      nombre: categoria.nombre,
      valor_mensualidad: categoria.valor_mensualidad,
      edad_minima: categoria.edad_minima,
      edad_maxima: categoria.edad_maxima,
      descripcion: categoria.descripcion || '',
      activo: categoria.activo
    };
    this.showEditForm = true;
    this.formError = '';
  }

  closeEditForm() {
    this.showEditForm = false;
    this.editingCategoria = null;
    this.editCategoriaData = {};
    this.formError = '';
  }

  isEditFormValid(): boolean {
    return !!(
      this.editCategoriaData.nombre &&
      this.editCategoriaData.valor_mensualidad > 0
    );
  }

  onSubmitEdit() {
    this.formSubmitted = true;
    if (!this.isEditFormValid() || !this.editingCategoria) {
      this.formError = 'Por favor complete todos los campos obligatorios';
      return;
    }

    this.saving = true;
    this.formError = '';

    const dataToSend: any = {
      nombre: this.editCategoriaData.nombre,
      valor_mensualidad: this.editCategoriaData.valor_mensualidad,
      activo: this.editCategoriaData.activo
    };

    if (this.editCategoriaData.edad_minima !== null && this.editCategoriaData.edad_minima !== undefined) {
      dataToSend.edad_minima = this.editCategoriaData.edad_minima;
    }
    if (this.editCategoriaData.edad_maxima !== null && this.editCategoriaData.edad_maxima !== undefined) {
      dataToSend.edad_maxima = this.editCategoriaData.edad_maxima;
    }
    if (this.editCategoriaData.descripcion) {
      dataToSend.descripcion = this.editCategoriaData.descripcion;
    }

    this.api.patch<any>(`categorias/${this.editingCategoria.id}`, dataToSend).subscribe({
      next: (response) => {
        this.saving = false;
        this.toast.success(`Categoría "${response.data?.nombre || response.nombre}" actualizada exitosamente`);
        this.closeEditForm();
        this.loadCategorias();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'Error al actualizar la categoria';
        console.error('Error updating categoria:', err);
      }
    });
  }

  toggleActive(categoria: Categoria) {
    this.api.patch<any>(`categorias/${categoria.id}/toggle-active`, {}).subscribe({
      next: (response) => {
        const updated = response.data || response;
        this.toast.success(`Categoría "${updated.nombre}" ${updated.activo ? 'activada' : 'desactivada'}`);
        this.loadCategorias();
      },
      error: () => {
        this.toast.error('Error al cambiar el estado de la categoría');
      }
    });
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-CO').format(num);
  }
}
