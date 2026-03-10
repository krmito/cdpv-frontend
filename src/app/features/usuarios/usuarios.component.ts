import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { PermisosRolesComponent } from './permisos-roles.component';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  usuario: string;
  rol: 'administrador' | 'tesorero' | 'consulta' | 'acudiente';
  activo: boolean;
  fecha_creacion: string;
  ultimo_acceso: string | null;
}

interface JugadorVinculado {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  categoria?: { nombre: string };
}

interface CreateUsuarioForm {
  nombre: string;
  email: string;
  usuario: string;
  password: string;
  rol: string;
}

interface EditUsuarioForm {
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

interface FormErrors {
  nombre?: string;
  email?: string;
  usuario?: string;
  password?: string;
  rol?: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent, PageHeaderComponent, PermisosRolesComponent],
  template: `
    <div class="layout">
      <app-navbar/>
      <div class="main-container">
        <app-sidebar/>
        <main class="content">
          <app-page-header
            title="Gestión de Usuarios"
            subtitle="Administra usuarios y permisos del sistema"
            icon="🔐"
          />

          <!-- Tabs -->
          <div class="tabs">
            <button class="tab-btn" [class.active]="activeTab() === 'usuarios'" (click)="activeTab.set('usuarios')">
              👤 Usuarios
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'permisos'" (click)="activeTab.set('permisos')">
              🔑 Permisos por Rol
            </button>
          </div>

          <!-- TAB USUARIOS -->
          @if (activeTab() === 'usuarios') {
            <div class="card">
              <div class="card-actions">
                <button class="btn btn-primary" (click)="openCreateModal()">
                  ➕ Nuevo Usuario
                </button>
              </div>

              <!-- Skeleton loader -->
              @if (loading()) {
                <div class="skeleton-table" aria-busy="true" aria-label="Cargando usuarios">
                  @for (i of [1,2,3,4,5]; track i) {
                    <div class="skeleton-row">
                      <div class="skeleton-cell skeleton-avatar"></div>
                      <div class="skeleton-cell skeleton-text lg"></div>
                      <div class="skeleton-cell skeleton-text md"></div>
                      <div class="skeleton-cell skeleton-text sm"></div>
                      <div class="skeleton-cell skeleton-badge"></div>
                      <div class="skeleton-cell skeleton-actions"></div>
                    </div>
                  }
                </div>
              } @else if (usuarios().length === 0) {
                <div class="empty-state">
                  <div class="empty-icon">👤</div>
                  <h4>No hay usuarios registrados</h4>
                  <p>Crea el primer usuario del sistema</p>
                  <button class="btn btn-primary" (click)="openCreateModal()">➕ Nuevo Usuario</button>
                </div>
              } @else {
                <div class="table-responsive card-table">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Último acceso</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (u of usuarios(); track u.id) {
                        <tr [class.inactive-row]="!u.activo">
                          <td data-label="Nombre">
                            <div class="user-name">
                              <div class="avatar" [class]="'avatar-' + u.rol">{{ getInitial(u.nombre) }}</div>
                              <span>{{ u.nombre }}</span>
                              @if (u.id === currentUserId()) {
                                <span class="you-badge">Tú</span>
                              }
                            </div>
                          </td>
                          <td data-label="Email" class="text-muted">{{ u.email }}</td>
                          <td data-label="Usuario"><code class="username-code">{{ u.usuario }}</code></td>
                          <td data-label="Rol"><span class="rol-badge" [class]="'rol-' + u.rol">{{ u.rol }}</span></td>
                          <td data-label="Estado">
                            <span class="estado-badge" [class.estado-activo]="u.activo" [class.estado-inactivo]="!u.activo">
                              {{ u.activo ? 'Activo' : 'Inactivo' }}
                            </span>
                          </td>
                          <td data-label="Último acceso" class="text-muted text-sm">
                            {{ u.ultimo_acceso ? formatDate(u.ultimo_acceso) : 'Nunca' }}
                          </td>
                          <td data-label="">
                            <div class="action-btns">
                              <button class="btn-icon btn-edit" (click)="openEditModal(u)" title="Editar">✏️</button>
                              @if (u.id !== currentUserId()) {
                                <button class="btn-icon btn-toggle"
                                  [title]="u.activo ? 'Desactivar' : 'Activar'"
                                  (click)="toggleActive(u)">
                                  {{ u.activo ? '🔴' : '🟢' }}
                                </button>
                                <button class="btn-icon btn-delete" (click)="confirmDelete(u)" title="Eliminar">🗑️</button>
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

          <!-- TAB PERMISOS -->
          @if (activeTab() === 'permisos') {
            <div class="card">
              <app-permisos-roles/>
            </div>
          }
        </main>
      </div>
    </div>

    <!-- Modal Crear Usuario -->
    @if (showCreateModal()) {
      <div class="modal-backdrop" (click)="closeCreateModal()">
        <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="create-title" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 id="create-title">Nuevo Usuario</h3>
            <button class="btn-close" (click)="closeCreateModal()">×</button>
          </div>
          <form (ngSubmit)="createUsuario()" #createForm="ngForm">
            <div class="modal-body">
              @if (formError()) {
                <div class="alert alert-danger" role="alert">{{ formError() }}</div>
              }

              <div class="form-group">
                <label for="create-nombre">Nombre completo *</label>
                <input id="create-nombre" type="text" class="form-control" [class.is-invalid]="errors().nombre"
                  [(ngModel)]="createData.nombre" name="nombre" placeholder="Ej: Juan Pérez">
                @if (errors().nombre) { <div class="field-error">{{ errors().nombre }}</div> }
              </div>

              <div class="form-group">
                <label for="create-email">Email *</label>
                <input id="create-email" type="email" class="form-control" [class.is-invalid]="errors().email"
                  [(ngModel)]="createData.email" name="email" placeholder="juan@club.com">
                @if (errors().email) { <div class="field-error">{{ errors().email }}</div> }
              </div>

              <div class="form-group">
                <label for="create-usuario">Nombre de usuario *</label>
                <input id="create-usuario" type="text" class="form-control" [class.is-invalid]="errors().usuario"
                  [(ngModel)]="createData.usuario" name="usuario" placeholder="jperez">
                @if (errors().usuario) { <div class="field-error">{{ errors().usuario }}</div> }
              </div>

              <div class="form-group">
                <label for="create-password">Contraseña *</label>
                <input id="create-password" type="password" class="form-control" [class.is-invalid]="errors().password"
                  [(ngModel)]="createData.password" name="password" placeholder="Mínimo 6 caracteres">
                @if (errors().password) { <div class="field-error">{{ errors().password }}</div> }
              </div>

              <div class="form-group">
                <label for="create-rol">Rol *</label>
                <select id="create-rol" class="form-control" [class.is-invalid]="errors().rol"
                  [(ngModel)]="createData.rol" name="rol">
                  <option value="">Seleccionar rol</option>
                  <option value="administrador">Administrador</option>
                  <option value="tesorero">Tesorero</option>
                  <option value="consulta">Consulta</option>
                  <option value="acudiente">Acudiente</option>
                </select>
                @if (errors().rol) { <div class="field-error">{{ errors().rol }}</div> }
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) { Creando... } @else { Crear Usuario }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal Editar Usuario -->
    @if (showEditModal()) {
      <div class="modal-backdrop" (click)="closeEditModal()">
        <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-title" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 id="edit-title">Editar Usuario</h3>
            <button class="btn-close" (click)="closeEditModal()">×</button>
          </div>
          <form (ngSubmit)="updateUsuario()">
            <div class="modal-body">
              @if (formError()) {
                <div class="alert alert-danger" role="alert">{{ formError() }}</div>
              }

              <div class="form-group">
                <label for="edit-nombre">Nombre completo *</label>
                <input id="edit-nombre" type="text" class="form-control" [class.is-invalid]="errors().nombre"
                  [(ngModel)]="editData.nombre" name="nombre" placeholder="Nombre completo">
                @if (errors().nombre) { <div class="field-error">{{ errors().nombre }}</div> }
              </div>

              <div class="form-group">
                <label for="edit-email">Email *</label>
                <input id="edit-email" type="email" class="form-control" [class.is-invalid]="errors().email"
                  [(ngModel)]="editData.email" name="email">
                @if (errors().email) { <div class="field-error">{{ errors().email }}</div> }
              </div>

              <div class="form-group">
                <label for="edit-rol">Rol *</label>
                <select id="edit-rol" class="form-control" [class.is-invalid]="errors().rol"
                  [(ngModel)]="editData.rol" name="rol" (change)="onEditRolChange()">
                  <option value="administrador">Administrador</option>
                  <option value="tesorero">Tesorero</option>
                  <option value="consulta">Consulta</option>
                  <option value="acudiente">Acudiente</option>
                </select>
                @if (errors().rol) { <div class="field-error">{{ errors().rol }}</div> }
              </div>

              <div class="form-group form-group-check">
                <label class="check-label">
                  <input type="checkbox" [(ngModel)]="editData.activo" name="activo">
                  <span>Usuario activo</span>
                </label>
              </div>

              @if (editData.rol === 'acudiente') {
                <div class="vinculaciones-section">
                  <h4>Jugadores Vinculados</h4>
                  @if (cargandoVinculaciones()) {
                    <p class="no-vinculados">Cargando...</p>
                  } @else if (jugadoresVinculados().length === 0) {
                    <p class="no-vinculados">Sin jugadores vinculados</p>
                  } @else {
                    @for (j of jugadoresVinculados(); track j.id) {
                      <div class="jugador-vinculado-row">
                        <div class="jugador-vinculado-info">
                          <span class="jugador-vinculado-nombre">{{ j.nombre }} {{ j.apellido }}</span>
                          <span class="jugador-vinculado-meta">{{ j.categoria?.nombre ?? '' }} · Doc: {{ j.documento }}</span>
                        </div>
                        <button class="btn-desvincular" (click)="desvincularJugador(j.id)" type="button">✕ Quitar</button>
                      </div>
                    }
                  }
                  <div class="search-jugador-wrap">
                    <input type="text" class="form-control" placeholder="Buscar jugador por nombre o documento..."
                      [(ngModel)]="searchJugadorText" name="searchJugador"
                      (input)="onSearchJugador($event)" />
                  </div>
                  @if (searchResultados().length > 0) {
                    <div class="search-results">
                      @for (r of searchResultados(); track r.id) {
                        <div class="search-result-item">
                          <div>
                            <span style="font-weight:600">{{ r.nombre }} {{ r.apellido }}</span>
                            <span style="color:#94a3b8;font-size:11px;margin-left:8px">{{ r.categoria?.nombre }} · {{ r.documento }}</span>
                          </div>
                          <button class="btn-vincular-item" (click)="vincularJugador(r.id)" type="button">+ Vincular</button>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeEditModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) { Guardando... } @else { Guardar Cambios }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal Confirmar Eliminar -->
    @if (showDeleteModal()) {
      <div class="modal-backdrop" (click)="showDeleteModal.set(false)">
        <div class="modal-dialog modal-sm" role="dialog" aria-modal="true" aria-labelledby="delete-title" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 id="delete-title">Eliminar Usuario</h3>
            <button class="btn-close" (click)="showDeleteModal.set(false)">×</button>
          </div>
          <div class="modal-body">
            <p>¿Está seguro de eliminar al usuario <strong>{{ selectedUsuario()?.nombre }}</strong>?</p>
            <p class="text-muted text-sm">Esta acción no se puede deshacer.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showDeleteModal.set(false)">Cancelar</button>
            <button class="btn btn-danger" (click)="deleteUsuario()" [disabled]="saving()">
              @if (saving()) { Eliminando... } @else { Eliminar }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  activeTab = signal<'usuarios' | 'permisos'>('usuarios');
  loading = signal(true);
  usuarios = signal<Usuario[]>([]);
  currentUserId = signal<number | null>(null);

  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  selectedUsuario = signal<Usuario | null>(null);

  saving = signal(false);
  formError = signal('');
  errors = signal<FormErrors>({});

  createData: CreateUsuarioForm = { nombre: '', email: '', usuario: '', password: '', rol: '' };
  editData: EditUsuarioForm = { nombre: '', email: '', rol: '', activo: true };

  // Jugadores vinculados (para modal acudiente)
  jugadoresVinculados = signal<JugadorVinculado[]>([]);
  cargandoVinculaciones = signal(false);
  searchJugadorText = '';
  searchResultados = signal<any[]>([]);
  private searchSubject = new Subject<string>();

  ngOnInit() {
    const user = this.authService.currentUser();
    this.currentUserId.set(user?.id ?? null);
    this.cargarUsuarios();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.api.get<any>(`jugadores?search=${encodeURIComponent(term)}&limit=5`))
    ).subscribe({
      next: (res) => this.searchResultados.set(res?.data ?? res ?? []),
      error: () => {}
    });
  }

  cargarUsuarios() {
    this.loading.set(true);
    this.api.get<Usuario[]>('usuarios').subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los usuarios');
        this.loading.set(false);
      }
    });
  }

  openCreateModal() {
    this.createData = { nombre: '', email: '', usuario: '', password: '', rol: '' };
    this.errors.set({});
    this.formError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  createUsuario() {
    if (!this.validateCreate()) return;
    this.saving.set(true);
    this.formError.set('');
    this.api.post<any>('usuarios', this.createData).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.toast.success(res?.message || 'Usuario creado exitosamente');
        this.closeCreateModal();
        this.cargarUsuarios();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.message || 'Error al crear el usuario');
      }
    });
  }

  openEditModal(usuario: Usuario) {
    this.selectedUsuario.set(usuario);
    this.editData = { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, activo: usuario.activo };
    this.errors.set({});
    this.formError.set('');
    this.jugadoresVinculados.set([]);
    this.searchResultados.set([]);
    this.searchJugadorText = '';
    this.showEditModal.set(true);
    if (usuario.rol === 'acudiente') {
      this.cargarJugadoresVinculados(usuario.id);
    }
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedUsuario.set(null);
    this.jugadoresVinculados.set([]);
    this.searchResultados.set([]);
  }

  onEditRolChange() {
    if (this.editData.rol === 'acudiente' && this.selectedUsuario()) {
      this.cargarJugadoresVinculados(this.selectedUsuario()!.id);
    }
  }

  cargarJugadoresVinculados(usuarioId: number) {
    this.cargandoVinculaciones.set(true);
    this.api.get<JugadorVinculado[]>(`usuarios/${usuarioId}/jugadores`).subscribe({
      next: (data) => {
        this.jugadoresVinculados.set(data);
        this.cargandoVinculaciones.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los jugadores vinculados');
        this.cargandoVinculaciones.set(false);
      }
    });
  }

  onSearchJugador(event: Event) {
    const term = (event.target as HTMLInputElement).value.trim();
    if (term.length >= 2) {
      this.searchSubject.next(term);
    } else {
      this.searchResultados.set([]);
    }
  }

  vincularJugador(jugadorId: number) {
    const usuarioId = this.selectedUsuario()!.id;
    this.api.post<any>(`usuarios/${usuarioId}/vincular-jugador`, { jugador_id: jugadorId }).subscribe({
      next: (res) => {
        this.toast.success(res?.message || 'Jugador vinculado');
        this.cargarJugadoresVinculados(usuarioId);
        this.searchResultados.set([]);
        this.searchJugadorText = '';
      },
      error: (err) => this.toast.error(err?.message || 'Error al vincular')
    });
  }

  desvincularJugador(jugadorId: number) {
    const usuarioId = this.selectedUsuario()!.id;
    this.api.delete<any>(`usuarios/${usuarioId}/jugadores/${jugadorId}`).subscribe({
      next: (res) => {
        this.toast.success(res?.message || 'Jugador desvinculado');
        this.cargarJugadoresVinculados(usuarioId);
      },
      error: () => this.toast.error('Error al desvincular')
    });
  }

  updateUsuario() {
    if (!this.validateEdit()) return;
    const id = this.selectedUsuario()!.id;
    this.saving.set(true);
    this.formError.set('');
    this.api.patch<any>(`usuarios/${id}`, this.editData).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.toast.success(res?.message || 'Usuario actualizado');
        this.closeEditModal();
        this.cargarUsuarios();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.message || 'Error al actualizar el usuario');
      }
    });
  }

  toggleActive(usuario: Usuario) {
    this.api.patch<any>(`usuarios/${usuario.id}/toggle-active`, {}).subscribe({
      next: (res) => {
        this.toast.success(res?.message || 'Estado actualizado');
        this.cargarUsuarios();
      },
      error: () => this.toast.error('Error al cambiar el estado')
    });
  }

  confirmDelete(usuario: Usuario) {
    this.selectedUsuario.set(usuario);
    this.showDeleteModal.set(true);
  }

  deleteUsuario() {
    const id = this.selectedUsuario()!.id;
    this.saving.set(true);
    this.api.delete<any>(`usuarios/${id}`).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.toast.success(res?.message || 'Usuario eliminado');
        this.showDeleteModal.set(false);
        this.selectedUsuario.set(null);
        this.cargarUsuarios();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Error al eliminar el usuario');
      }
    });
  }

  private validateCreate(): boolean {
    const errs: FormErrors = {};
    if (!this.createData.nombre.trim()) errs.nombre = 'El nombre es requerido';
    if (!this.createData.email.trim()) errs.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.createData.email)) errs.email = 'Email inválido';
    if (!this.createData.usuario.trim()) errs.usuario = 'El nombre de usuario es requerido';
    if (!this.createData.password) errs.password = 'La contraseña es requerida';
    else if (this.createData.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (!this.createData.rol) errs.rol = 'El rol es requerido';
    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  private validateEdit(): boolean {
    const errs: FormErrors = {};
    if (!this.editData.nombre.trim()) errs.nombre = 'El nombre es requerido';
    if (!this.editData.email.trim()) errs.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.editData.email)) errs.email = 'Email inválido';
    if (!this.editData.rol) errs.rol = 'El rol es requerido';
    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  getInitial(nombre: string): string {
    return nombre?.charAt(0)?.toUpperCase() ?? '?';
  }

  formatDate(date: string): string {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
