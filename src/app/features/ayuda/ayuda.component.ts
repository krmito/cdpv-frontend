import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-ayuda',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent, PageHeaderComponent],
  template: `
    <div class="layout">
      <app-navbar/>
      <div class="main-container">
        <app-sidebar/>
        <main class="content">
          <app-page-header
            title="Ayuda"
            subtitle="Guía de uso del sistema"
            icon="❓"
          />

          <div class="ayuda-container">
            <!-- Dashboard -->
            <div class="accordion-item">
              <button class="accordion-header" [class.active]="openSection === 'dashboard'" (click)="toggleSection('dashboard')">
                <div class="accordion-title">
                  <span class="accordion-icon">📊</span>
                  <span>Dashboard</span>
                </div>
                <span class="accordion-arrow" [class.open]="openSection === 'dashboard'">▶</span>
              </button>
              @if (openSection === 'dashboard') {
                <div class="accordion-body">
                  <p>El <strong>Dashboard</strong> es la pantalla principal del sistema. Aquí encontrarás:</p>
                  <ul>
                    <li><strong>Estadísticas generales:</strong> Total de jugadores activos, categorías, pagos del mes y mensualidades pendientes.</li>
                    <li><strong>Accesos rápidos:</strong> Botones para ir directamente a las secciones más utilizadas del sistema.</li>
                    <li><strong>Resumen visual:</strong> Indicadores con el estado general del club de un vistazo.</li>
                  </ul>
                </div>
              }
            </div>

            <!-- Jugadores -->
            <div class="accordion-item">
              <button class="accordion-header" [class.active]="openSection === 'jugadores'" (click)="toggleSection('jugadores')">
                <div class="accordion-title">
                  <span class="accordion-icon">👥</span>
                  <span>Jugadores</span>
                </div>
                <span class="accordion-arrow" [class.open]="openSection === 'jugadores'">▶</span>
              </button>
              @if (openSection === 'jugadores') {
                <div class="accordion-body">
                  <p>Módulo para la gestión completa de los jugadores del club.</p>

                  <h4>Crear jugador</h4>
                  <ol>
                    <li>Haz clic en el botón <strong>"Nuevo Jugador"</strong>.</li>
                    <li>Completa los <strong>campos obligatorios</strong> (marcados con <span class="req-mark">*</span>): nombre, apellido, documento, fecha de nacimiento, teléfono y categoría.</li>
                    <li>El formulario valida cada campo en tiempo real: si saltas un campo obligatorio sin llenarlo, verás el error de inmediato sin necesidad de enviar el formulario.</li>
                    <li>Completa opcionalmente: teléfono del acudiente, email, email del acudiente, dirección y posición.</li>
                    <li>Sube una foto del jugador haciendo clic en <strong>"Agregar foto"</strong> (formatos JPG o PNG).</li>
                    <li>Haz clic en <strong>"Guardar Jugador"</strong> para registrarlo. El sistema confirmará el registro con un mensaje de éxito.</li>
                  </ol>
                  <div class="info-note">
                    💡 Al guardar un jugador nuevo, el sistema le genera automáticamente la mensualidad del mes actual si aún no existe.
                  </div>

                  <h4>Editar jugador</h4>
                  <ol>
                    <li>Busca el jugador en la tabla.</li>
                    <li>Haz clic en el botón <strong>✏️ editar</strong> de la fila correspondiente.</li>
                    <li>Modifica los campos necesarios. La validación en tiempo real también aplica aquí.</li>
                    <li>Guarda los cambios con <strong>"Guardar Cambios"</strong>.</li>
                  </ol>

                  <h4>Buscar y filtrar</h4>
                  <ul>
                    <li>Usa la <strong>barra de búsqueda</strong> para encontrar jugadores por nombre, apellido o documento.</li>
                    <li>Filtra por <strong>categoría</strong> o por <strong>estado</strong> (activos / inactivos) usando los selectores desplegables.</li>
                  </ul>

                  <h4>Ver historial de pagos</h4>
                  <ul>
                    <li>Haz clic en el botón <strong>📋 historial</strong> de la fila del jugador para ver todos sus pagos y el estado de sus mensualidades.</li>
                  </ul>

                  <h4>Activar / Desactivar jugador</h4>
                  <ul>
                    <li>Al editar un jugador, puedes cambiar su estado con el interruptor <strong>"Jugador Activo"</strong>.</li>
                    <li>Los jugadores inactivos no aparecen en la generación de mensualidades ni en el cron automático.</li>
                  </ul>
                </div>
              }
            </div>

            <!-- Categorías -->
            <div class="accordion-item">
              <button class="accordion-header" [class.active]="openSection === 'categorias'" (click)="toggleSection('categorias')">
                <div class="accordion-title">
                  <span class="accordion-icon">📁</span>
                  <span>Categorías</span>
                </div>
                <span class="accordion-arrow" [class.open]="openSection === 'categorias'">▶</span>
              </button>
              @if (openSection === 'categorias') {
                <div class="accordion-body">
                  <p>Administra las categorías (divisiones) del club.</p>
                  <h4>Crear categoría</h4>
                  <ol>
                    <li>Haz clic en <strong>"Nueva Categoría"</strong>.</li>
                    <li>Ingresa el nombre, rango de edades, descripción y el <strong>valor de la mensualidad</strong>.</li>
                    <li>Guarda la categoría.</li>
                  </ol>
                  <h4>Editar categoría</h4>
                  <ul>
                    <li>Haz clic en el botón de editar en la fila correspondiente.</li>
                    <li>Puedes modificar todos los campos, incluyendo el valor de la mensualidad.</li>
                  </ul>
                  <h4>Activar / Desactivar</h4>
                  <ul>
                    <li>Usa el botón de <strong>activar/desactivar</strong> para controlar si una categoría está disponible.</li>
                    <li>Las categorías desactivadas no aparecen al crear o editar jugadores.</li>
                  </ul>
                  <h4>Valor de mensualidad</h4>
                  <ul>
                    <li>Cada categoría tiene un monto de mensualidad asociado.</li>
                    <li>Este valor se utiliza al generar las mensualidades de los jugadores de esa categoría.</li>
                  </ul>
                </div>
              }
            </div>

            <!-- Pagos -->
            <div class="accordion-item">
              <button class="accordion-header" [class.active]="openSection === 'pagos'" (click)="toggleSection('pagos')">
                <div class="accordion-title">
                  <span class="accordion-icon">💰</span>
                  <span>Pagos</span>
                </div>
                <span class="accordion-arrow" [class.open]="openSection === 'pagos'">▶</span>
              </button>
              @if (openSection === 'pagos') {
                <div class="accordion-body">
                  <p>Gestiona los cobros de mensualidades de los jugadores.</p>
                  <h4>Registrar pago</h4>
                  <ol>
                    <li>Haz clic en <strong>"Nuevo Pago"</strong>.</li>
                    <li>Selecciona el jugador y la mensualidad a pagar.</li>
                    <li>Ingresa el monto, método de pago y número de recibo.</li>
                    <li>Confirma el pago.</li>
                  </ol>
                  <h4>Métodos de pago</h4>
                  <ul>
                    <li>Efectivo, transferencia bancaria, pago móvil y otros métodos disponibles.</li>
                  </ul>
                  <h4>Anular pago</h4>
                  <ul>
                    <li>Si un pago fue registrado por error, puedes <strong>anularlo</strong> haciendo clic en el botón correspondiente.</li>
                    <li>Al anular un pago, el saldo de la mensualidad se actualiza automáticamente.</li>
                  </ul>
                  <h4>Recibos</h4>
                  <ul>
                    <li>Cada pago genera un número de recibo que sirve como comprobante.</li>
                  </ul>
                </div>
              }
            </div>

            <!-- Mensualidades -->
            <div class="accordion-item">
              <button class="accordion-header" [class.active]="openSection === 'mensualidades'" (click)="toggleSection('mensualidades')">
                <div class="accordion-title">
                  <span class="accordion-icon">📅</span>
                  <span>Mensualidades</span>
                </div>
                <span class="accordion-arrow" [class.open]="openSection === 'mensualidades'">▶</span>
              </button>
              @if (openSection === 'mensualidades') {
                <div class="accordion-body">
                  <p>Control de las cuotas mensuales de cada jugador.</p>

                  <h4>Generación automática (cron)</h4>
                  <ul>
                    <li>El sistema genera las mensualidades <strong>automáticamente el primer día de cada mes</strong> para todos los jugadores activos.</li>
                    <li>El monto de cada mensualidad corresponde al valor configurado en la categoría del jugador.</li>
                    <li>No es necesario hacer nada manualmente: el proceso corre en el servidor de forma programada.</li>
                  </ul>
                  <div class="info-note">
                    💡 Si un jugador estaba inactivo al momento de la generación automática, no se le creará mensualidad. Si luego se activa, deberá generarse manualmente.
                  </div>

                  <h4>Generación manual</h4>
                  <ol>
                    <li>Ve a la pestaña <strong>"Generar Mensualidades"</strong>.</li>
                    <li>Selecciona el <strong>mes</strong> y el <strong>año</strong> para el que deseas generar.</li>
                    <li>Opcionalmente ajusta la <strong>fecha de vencimiento</strong> (por defecto: 30 días desde hoy).</li>
                    <li>El sistema muestra cuántos jugadores ya tienen mensualidad y cuántos faltan.</li>
                    <li>Haz clic en <strong>"Generar Mensualidades"</strong>. Solo se crearán las que aún no existan, sin duplicar.</li>
                  </ol>
                  <div class="info-note">
                    💡 Usa la generación manual para meses anteriores, para jugadores nuevos que no estaban en el cron, o si necesitas regenerar un mes específico.
                  </div>

                  <h4>Estados</h4>
                  <ul>
                    <li><strong>Pendiente:</strong> La mensualidad fue generada pero aún no tiene pagos.</li>
                    <li><strong>Pagada:</strong> El monto total ha sido cubierto.</li>
                    <li><strong>Vencida:</strong> La fecha de vencimiento expiró sin completar el monto.</li>
                  </ul>

                  <h4>Seguimiento</h4>
                  <ul>
                    <li>En la pestaña <strong>"Listado"</strong> podés filtrar por mes, año, categoría y estado.</li>
                    <li>En la pestaña <strong>"Resumen"</strong> ves el total recaudado, pendiente y la tasa de cumplimiento del período.</li>
                  </ul>
                </div>
              }
            </div>

            <!-- Reportes -->
            <div class="accordion-item">
              <button class="accordion-header" [class.active]="openSection === 'reportes'" (click)="toggleSection('reportes')">
                <div class="accordion-title">
                  <span class="accordion-icon">📈</span>
                  <span>Reportes</span>
                </div>
                <span class="accordion-arrow" [class.open]="openSection === 'reportes'">▶</span>
              </button>
              @if (openSection === 'reportes') {
                <div class="accordion-body">
                  <p>Genera reportes del club para análisis y toma de decisiones.</p>
                  <h4>Tipos de reportes</h4>
                  <ul>
                    <li><strong>Reporte de pagos:</strong> Detalle de pagos recibidos por período.</li>
                    <li><strong>Reporte de morosidad:</strong> Jugadores con mensualidades vencidas o pendientes.</li>
                    <li><strong>Reporte por categoría:</strong> Estado de pagos agrupado por categoría.</li>
                  </ul>
                  <h4>Exportar</h4>
                  <ul>
                    <li>Exporta los reportes a <strong>Excel</strong> o <strong>PDF</strong> para compartirlos o imprimirlos.</li>
                    <li>Usa los botones de exportación disponibles en cada reporte.</li>
                  </ul>
                </div>
              }
            </div>

            <!-- Importar Jugadores -->
            <div class="accordion-item">
              <button class="accordion-header" [class.active]="openSection === 'importar'" (click)="toggleSection('importar')">
                <div class="accordion-title">
                  <span class="accordion-icon">📥</span>
                  <span>Importar Jugadores (Excel)</span>
                </div>
                <span class="accordion-arrow" [class.open]="openSection === 'importar'">▶</span>
              </button>
              @if (openSection === 'importar') {
                <div class="accordion-body">
                  <p>Permite registrar múltiples jugadores a la vez desde un archivo Excel.</p>
                  <h4>Paso a paso</h4>
                  <ol>
                    <li><strong>Descargar plantilla:</strong> En la sección de Jugadores, haz clic en <strong>"Importar"</strong> y luego en <strong>"Descargar Plantilla"</strong>. Se descargará un archivo Excel con el formato correcto.</li>
                    <li><strong>Llenar la plantilla:</strong> Abre el archivo descargado y completa los datos de los jugadores (nombre, apellido, documento, etc.). No modifiques los encabezados de las columnas.</li>
                    <li><strong>Subir archivo:</strong> Regresa a la sección de importación y selecciona el archivo Excel completado.</li>
                    <li><strong>Vista previa:</strong> El sistema mostrará una tabla con los datos leídos del archivo. Revisa que la información sea correcta.</li>
                    <li><strong>Importar:</strong> Haz clic en <strong>"Importar"</strong> para registrar los jugadores. El sistema te indicará cuántos fueron importados exitosamente y si hubo errores.</li>
                  </ol>
                  <h4>Recomendaciones</h4>
                  <ul>
                    <li>Usa siempre la plantilla descargada para evitar errores de formato.</li>
                    <li>Asegúrate de que los documentos de identidad no estén duplicados.</li>
                    <li>Las categorías deben existir previamente en el sistema.</li>
                  </ul>
                </div>
              }
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary-blue: #1a3a5c;
      --primary-yellow: #ffde00;
      --dark-blue: #0d1f33;
    }

    .layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-container {
      display: flex;
      flex: 1;
    }

    .content {
      flex: 1;
      padding: 24px;
      background: #f0f2f5;
      overflow-y: auto;
      height: calc(100vh - 64px);
    }

    .ayuda-container {
      max-width: 900px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Accordion */
    .accordion-item {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .accordion-header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px;
      background: white;
      border: none;
      cursor: pointer;
      transition: background 0.2s ease;
      font-size: 15px;
      font-weight: 600;
      color: var(--primary-blue);
    }

    .accordion-header:hover {
      background: #f8f9fa;
    }

    .accordion-header.active {
      background: linear-gradient(135deg, var(--primary-blue), var(--dark-blue));
      color: var(--primary-yellow);
    }

    .accordion-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .accordion-icon {
      font-size: 20px;
    }

    .accordion-arrow {
      font-size: 12px;
      transition: transform 0.3s ease;
      color: #aaa;
    }

    .accordion-header.active .accordion-arrow {
      color: var(--primary-yellow);
    }

    .accordion-arrow.open {
      transform: rotate(90deg);
    }

    .accordion-body {
      padding: 20px 24px 24px;
      border-top: 1px solid #eee;
      color: #444;
      font-size: 14px;
      line-height: 1.7;
    }

    .accordion-body p {
      margin: 0 0 14px;
    }

    .accordion-body h4 {
      margin: 18px 0 8px;
      color: var(--primary-blue);
      font-size: 14px;
      font-weight: 600;
    }

    .accordion-body h4:first-of-type {
      margin-top: 4px;
    }

    .accordion-body ul,
    .accordion-body ol {
      margin: 0 0 10px;
      padding-left: 22px;
    }

    .accordion-body li {
      margin-bottom: 6px;
    }

    .accordion-body strong {
      color: #1a3a5c;
    }

    .info-note {
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
      border-radius: 0 8px 8px 0;
      padding: 10px 14px;
      margin: 12px 0;
      font-size: 13px;
      color: #1e40af;
      line-height: 1.5;
    }

    .req-mark {
      color: #ef4444;
      font-weight: 700;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .content {
        padding: 16px;
      }

      .accordion-header {
        padding: 14px 16px;
        font-size: 14px;
      }

      .accordion-body {
        padding: 16px;
      }
    }
  `]
})
export class AyudaComponent {
  openSection: string | null = null;

  toggleSection(section: string): void {
    this.openSection = this.openSection === section ? null : section;
  }
}
