import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { PermisosService } from '../../core/services/permisos.service';

interface PermisosRol {
  id: number;
  rol: string;
  modulo: string;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

interface MatrizFila {
  modulo: string;
  label: string;
  tesorero: PermisosRol | null;
  consulta: PermisosRol | null;
  admin: { puede_ver: boolean; puede_crear: boolean; puede_editar: boolean; puede_eliminar: boolean };
}

@Component({
  selector: 'app-permisos-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="permisos-container">
      <div class="permisos-header">
        <div>
          <h3>Permisos por Rol</h3>
          <p class="subtitle">Configura qué acciones puede realizar cada rol en cada módulo</p>
        </div>
        <button class="btn btn-outline btn-sm" (click)="confirmarInicializar()" [disabled]="inicializando()">
          @if (inicializando()) { Restaurando... } @else { Restaurar valores por defecto }
        </button>
      </div>

      @if (loading()) {
        <div class="skeleton-table" aria-busy="true" aria-label="Cargando permisos">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-row">
              <div class="skeleton-cell skeleton-text"></div>
              <div class="skeleton-cell skeleton-checks"></div>
              <div class="skeleton-cell skeleton-checks"></div>
              <div class="skeleton-cell skeleton-checks"></div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="alert alert-danger" role="alert" aria-live="polite">{{ error() }}</div>
      } @else {
        <div class="table-responsive">
          <table class="permisos-table">
            <thead>
              <tr>
                <th class="col-modulo">Módulo</th>
                <th class="col-rol admin-col">
                  <div class="rol-header">
                    <span class="rol-badge admin">ADMINISTRADOR</span>
                    <small>acceso completo</small>
                  </div>
                </th>
                <th class="col-rol">
                  <div class="rol-header">
                    <span class="rol-badge tesorero">TESORERO</span>
                    <div class="accion-labels">
                      <span>Ver</span><span>Crear</span><span>Editar</span><span>Eliminar</span>
                    </div>
                  </div>
                </th>
                <th class="col-rol">
                  <div class="rol-header">
                    <span class="rol-badge consulta">CONSULTA</span>
                    <div class="accion-labels">
                      <span>Ver</span><span>Crear</span><span>Editar</span><span>Eliminar</span>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              @for (fila of matriz(); track fila.modulo) {
                <tr>
                  <td class="modulo-cell">
                    <span class="modulo-icon">{{ getModuloIcon(fila.modulo) }}</span>
                    <span class="modulo-nombre">{{ fila.label }}</span>
                  </td>
                  <!-- ADMIN: readonly, todo true -->
                  <td class="admin-col">
                    <div class="checks-row readonly">
                      <span class="check-icon check-true">✓</span>
                      <span class="check-icon check-true">✓</span>
                      <span class="check-icon check-true">✓</span>
                      <span class="check-icon check-true">✓</span>
                    </div>
                  </td>
                  <!-- TESORERO -->
                  <td>
                    @if (fila.tesorero) {
                      <div class="checks-row">
                        <input type="checkbox" [(ngModel)]="fila.tesorero.puede_ver"
                          (change)="onCheckChange(fila.tesorero!, 'puede_ver')" class="perm-check" title="Ver">
                        <input type="checkbox" [(ngModel)]="fila.tesorero.puede_crear"
                          (change)="onCheckChange(fila.tesorero!, 'puede_crear')" class="perm-check" title="Crear">
                        <input type="checkbox" [(ngModel)]="fila.tesorero.puede_editar"
                          (change)="onCheckChange(fila.tesorero!, 'puede_editar')" class="perm-check" title="Editar">
                        <input type="checkbox" [(ngModel)]="fila.tesorero.puede_eliminar"
                          (change)="onCheckChange(fila.tesorero!, 'puede_eliminar')" class="perm-check" title="Eliminar">
                        @if (savingKey() === 'tesorero-' + fila.modulo) {
                          <span class="saving-spinner" title="Guardando...">⏳</span>
                        }
                      </div>
                    }
                  </td>
                  <!-- CONSULTA -->
                  <td>
                    @if (fila.consulta) {
                      <div class="checks-row">
                        <input type="checkbox" [(ngModel)]="fila.consulta.puede_ver"
                          (change)="onCheckChange(fila.consulta!, 'puede_ver')" class="perm-check" title="Ver">
                        <input type="checkbox" [(ngModel)]="fila.consulta.puede_crear"
                          (change)="onCheckChange(fila.consulta!, 'puede_crear')" class="perm-check" title="Crear">
                        <input type="checkbox" [(ngModel)]="fila.consulta.puede_editar"
                          (change)="onCheckChange(fila.consulta!, 'puede_editar')" class="perm-check" title="Editar">
                        <input type="checkbox" [(ngModel)]="fila.consulta.puede_eliminar"
                          (change)="onCheckChange(fila.consulta!, 'puede_eliminar')" class="perm-check" title="Eliminar">
                        @if (savingKey() === 'consulta-' + fila.modulo) {
                          <span class="saving-spinner" title="Guardando...">⏳</span>
                        }
                      </div>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="note">Los cambios se guardan automáticamente al marcar/desmarcar cada casilla.</p>
      }

      <!-- Modal confirmación -->
      @if (showConfirmModal()) {
        <div class="modal-backdrop" (click)="showConfirmModal.set(false)">
          <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h4 id="confirm-title">Restaurar valores por defecto</h4>
            </div>
            <div class="modal-body">
              <p>¿Está seguro de restaurar todos los permisos a sus valores por defecto? Esta acción sobrescribirá los permisos actuales.</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showConfirmModal.set(false)">Cancelar</button>
              <button class="btn btn-danger" (click)="doInicializar()">Restaurar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './permisos-roles.component.css'
})
export class PermisosRolesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private permisosService = inject(PermisosService);

  loading = signal(true);
  error = signal('');
  matriz = signal<MatrizFila[]>([]);
  savingKey = signal('');
  inicializando = signal(false);
  showConfirmModal = signal(false);

  private readonly MODULOS = [
    { key: 'jugadores', label: 'Jugadores' },
    { key: 'categorias', label: 'Categorías' },
    { key: 'pagos', label: 'Pagos' },
    { key: 'mensualidades', label: 'Mensualidades' },
    { key: 'reportes', label: 'Reportes' },
  ];

  private debounceTimers: Record<string, any> = {};

  ngOnInit() {
    this.cargarPermisos();
  }

  cargarPermisos() {
    this.loading.set(true);
    this.error.set('');
    this.api.get<PermisosRol[]>('permisos-roles').subscribe({
      next: (permisos) => {
        const filas: MatrizFila[] = this.MODULOS.map(m => ({
          modulo: m.key,
          label: m.label,
          tesorero: permisos.find(p => p.rol === 'tesorero' && p.modulo === m.key) ?? null,
          consulta: permisos.find(p => p.rol === 'consulta' && p.modulo === m.key) ?? null,
          admin: { puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        }));
        this.matriz.set(filas);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los permisos. Puede que necesite inicializarlos primero.');
        this.loading.set(false);
      }
    });
  }

  onCheckChange(permiso: PermisosRol, campo: string) {
    const key = `${permiso.rol}-${permiso.modulo}`;
    clearTimeout(this.debounceTimers[key]);

    this.debounceTimers[key] = setTimeout(() => {
      this.savingKey.set(key);
      const dto: any = {};
      dto[campo] = (permiso as any)[campo];

      this.api.patch(`permisos-roles/${permiso.rol}/${permiso.modulo}`, dto).subscribe({
        next: () => {
          this.savingKey.set('');
          this.toast.success('Permiso actualizado');
        },
        error: () => {
          this.savingKey.set('');
          this.toast.error('Error al guardar el permiso');
          // revertir checkbox
          (permiso as any)[campo] = !(permiso as any)[campo];
        }
      });
    }, 300);
  }

  confirmarInicializar() {
    this.showConfirmModal.set(true);
  }

  doInicializar() {
    this.showConfirmModal.set(false);
    this.inicializando.set(true);
    this.api.post('permisos-roles/inicializar', {}).subscribe({
      next: (res: any) => {
        this.inicializando.set(false);
        this.toast.success(res?.message || 'Permisos restaurados');
        this.cargarPermisos();
        // Recargar permisos propios
        this.permisosService.cargarPermisos().subscribe();
      },
      error: () => {
        this.inicializando.set(false);
        this.toast.error('Error al restaurar los permisos');
      }
    });
  }

  getModuloIcon(modulo: string): string {
    const icons: Record<string, string> = {
      jugadores: '👥', categorias: '📁', pagos: '💰', mensualidades: '📅', reportes: '📈'
    };
    return icons[modulo] ?? '📋';
  }
}
