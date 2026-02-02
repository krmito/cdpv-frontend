import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
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
            <button class="btn btn-primary btn-new" (click)="openNewForm()">
              <span>➕</span> Nueva Categoría
            </button>
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

          <!-- Loading -->
          @if (loading) {
            <div class="loading">
              <p>Cargando categorias...</p>
            </div>
          }

          <!-- Tabla de Categorias -->
          @if (!loading && !error) {
            <div class="card">
              <div class="table-header">
                <h3>Lista de Categorias</h3>
                <span class="badge">{{ categorias.length }} categorias</span>
              </div>

              @if (categorias.length === 0) {
                <div class="empty-state">
                  <p>No hay categorias registradas</p>
                  <button class="btn btn-primary" (click)="openNewForm()">
                    + Crear Primera Categoria
                  </button>
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
                              <button class="btn-icon" (click)="openEditForm(categoria)" title="Editar">
                                ✏️
                              </button>
                              <button
                                class="btn-icon"
                                (click)="toggleActive(categoria)"
                                [title]="categoria.activo ? 'Desactivar' : 'Activar'"
                              >
                                {{ categoria.activo ? '🔴' : '🟢' }}
                              </button>
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
            <div class="modal-overlay">
              <div class="modal-card">
                <div class="modal-header">
                  <h2>+ Nueva Categoria</h2>
                  <button class="btn-close" (click)="closeNewForm()">✕</button>
                </div>

                <form (ngSubmit)="onSubmit()">
                  <div class="modal-body">
                    @if (formError) {
                      <div class="alert alert-danger">
                        {{ formError }}
                      </div>
                    }

                    <div class="form-group">
                      <label>Nombre <span class="required">*</span></label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="newCategoria.nombre"
                        name="nombre"
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
                      <label>Valor Mensualidad <span class="required">*</span></label>
                      <div class="input-with-prefix">
                        <span class="prefix">$</span>
                        <input
                          type="number"
                          class="form-control"
                          [(ngModel)]="newCategoria.valor_mensualidad"
                          name="valor_mensualidad"
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
                        [(ngModel)]="newCategoria.descripcion"
                        name="descripcion"
                        rows="3"
                        placeholder="Descripcion de la categoria..."
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
                      [disabled]="!isFormValid() || saving"
                    >
                      {{ saving ? 'Guardando...' : 'Guardar Categoria' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          }

          <!-- Modal Editar Categoria -->
          @if (showEditForm && editingCategoria) {
            <div class="modal-overlay">
              <div class="modal-card">
                <div class="modal-header">
                  <h2>✏️ Editar Categoria</h2>
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
    .monto {
      font-weight: 600;
      color: #10b981;
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
    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .alert-success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #6ee7b7;
    }
    .alert-danger {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #4f46e5;
      color: white;
    }
    .btn-primary:hover {
      background: #4338ca;
    }
    .btn-primary:disabled {
      background: #a5b4fc;
      cursor: not-allowed;
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
      max-width: 500px;
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
    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #374151;
    }
    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .form-control:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    textarea.form-control {
      resize: vertical;
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
    .input-with-prefix {
      display: flex;
      align-items: stretch;
    }
    .input-with-prefix .prefix {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-right: none;
      border-radius: 6px 0 0 6px;
      padding: 10px 12px;
      color: #6b7280;
      font-weight: 500;
    }
    .input-with-prefix .form-control {
      border-radius: 0 6px 6px 0;
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
  `]
})
export class CategoriasComponent implements OnInit {
  private api = inject(ApiService);

  categorias: Categoria[] = [];
  loading = true;
  error = '';
  successMessage = '';
  showNewForm = false;
  showEditForm = false;
  saving = false;
  formError = '';

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

    if (this.newCategoria.edad_minima) {
      dataToSend.edad_minima = this.newCategoria.edad_minima;
    }
    if (this.newCategoria.edad_maxima) {
      dataToSend.edad_maxima = this.newCategoria.edad_maxima;
    }
    if (this.newCategoria.descripcion) {
      dataToSend.descripcion = this.newCategoria.descripcion;
    }

    this.api.post<any>('categorias', dataToSend).subscribe({
      next: (response) => {
        this.saving = false;
        this.showNewForm = false;
        this.successMessage = `Categoria "${response.data?.nombre || response.nombre}" creada exitosamente`;

        setTimeout(() => {
          this.successMessage = '';
        }, 5000);

        this.loadCategorias();
        this.resetForm();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'Error al crear la categoria';
        console.error('Error creating categoria:', err);
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
        this.successMessage = `Categoria "${response.data?.nombre || response.nombre}" actualizada exitosamente`;

        this.closeEditForm();
        this.loadCategorias();

        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
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
        this.successMessage = `Categoria "${updated.nombre}" ${updated.activo ? 'activada' : 'desactivada'}`;
        this.loadCategorias();

        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cambiar el estado';
        console.error('Error toggling categoria:', err);
      }
    });
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-CO').format(num);
  }
}
