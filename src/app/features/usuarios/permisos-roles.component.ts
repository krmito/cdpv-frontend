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
  styles: [`
    .permisos-container { padding: 0; }

    .permisos-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .permisos-header h3 { margin: 0 0 4px; font-size: 18px; color: #1a3a5c; }
    .subtitle { margin: 0; color: #666; font-size: 13px; }

    .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .btn-outline { background: transparent; border: 1.5px solid #1a3a5c; color: #1a3a5c; }
    .btn-outline:hover:not(:disabled) { background: #1a3a5c; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #444; }
    .btn-secondary:hover { background: #cbd5e0; }
    .btn-danger { background: #ef4444; color: #fff; }
    .btn-danger:hover { background: #dc2626; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .alert-danger { background: #fef2f2; color: #991b1b; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #ef4444; }

    /* Skeleton */
    .skeleton-table { display: flex; flex-direction: column; gap: 8px; }
    .skeleton-row { display: flex; gap: 12px; align-items: center; padding: 12px; background: #f8fafc; border-radius: 8px; }
    .skeleton-cell { background: #e2e8f0; border-radius: 4px; animation: pulse 1.5s infinite; }
    .skeleton-text { width: 120px; height: 16px; }
    .skeleton-checks { width: 140px; height: 24px; flex: 1; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    /* Table */
    .table-responsive { overflow-x: auto; }

    .permisos-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .permisos-table th {
      background: #f8fafc;
      padding: 12px 16px;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
      font-weight: 600;
      color: #374151;
    }

    .permisos-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .permisos-table tr:hover td { background: #f8fafc; }

    .col-modulo { width: 160px; }
    .col-rol { min-width: 200px; }
    .admin-col { min-width: 160px; }

    .rol-header { display: flex; flex-direction: column; gap: 6px; }

    .rol-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .rol-badge.admin { background: #fef3c7; color: #92400e; }
    .rol-badge.tesorero { background: #dbeafe; color: #1e40af; }
    .rol-badge.consulta { background: #f0fdf4; color: #166534; }

    .accion-labels { display: flex; gap: 22px; padding-left: 4px; }
    .accion-labels span { font-size: 11px; color: #6b7280; width: 24px; text-align: center; }

    .modulo-cell { display: flex; align-items: center; gap: 8px; }
    .modulo-icon { font-size: 16px; }
    .modulo-nombre { font-weight: 500; color: #374151; }

    .checks-row {
      display: flex;
      align-items: center;
      gap: 22px;
      padding-left: 4px;
    }

    .checks-row.readonly { gap: 22px; }

    .perm-check {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #1a3a5c;
    }

    .check-icon { font-size: 16px; width: 18px; text-align: center; }
    .check-true { color: #16a34a; font-weight: bold; }

    .saving-spinner { font-size: 14px; animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .note { font-size: 12px; color: #9ca3af; margin-top: 12px; text-align: center; }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-dialog {
      background: #fff; border-radius: 12px; padding: 0; width: 420px; max-width: 90vw;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .modal-header { padding: 20px 24px 0; }
    .modal-header h4 { margin: 0; font-size: 16px; color: #1a3a5c; }
    .modal-body { padding: 16px 24px; color: #444; font-size: 14px; line-height: 1.5; }
    .modal-footer { padding: 0 24px 20px; display: flex; justify-content: flex-end; gap: 8px; }
  `]
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
