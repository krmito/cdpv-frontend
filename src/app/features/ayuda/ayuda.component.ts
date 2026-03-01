import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AuthService } from '../../core/services/auth.service';

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
            [subtitle]="isAcudiente() ? 'Guía para acudientes y padres de familia' : 'Guía de uso del sistema'"
            icon="❓"
          />

          <!-- ===== AYUDA ACUDIENTE ===== -->
          @if (isAcudiente()) {
          <div class="ayuda-container">

            <div class="accordion-item">
              <button class="accordion-header" [class.active]="openSection === 'mis-hijos'" (click)="toggleSection('mis-hijos')">
                <div class="accordion-title"><span class="accordion-icon">👨‍👧‍👦</span><span>Mis Hijos</span></div>
                <span class="accordion-arrow" [class.open]="openSection === 'mis-hijos'">▶</span>
              </button>
              @if (openSection === 'mis-hijos') {
                <div class="accordion-body">
                  <p>En la sección <strong>Mis Hijos</strong> encuentras una tarjeta por cada jugador que el administrador te ha vinculado.</p>
                  <h4>¿Qué muestra cada tarjeta?</h4>
                  <ul>
                    <li><strong>Nombre, categoría y documento</strong> del jugador.</li>
                    <li><strong>Indicadores de mensualidades:</strong> cuántas están al día, cuántas pendientes y cuántas vencidas.</li>
                    <li><strong>Saldo total pendiente</strong> si hay cuotas sin pagar.</li>
                  </ul>
                  <h4>¿Qué hago si mi hijo no aparece?</h4>
                  <p>Comunícate con el administrador del club para que vincule a tu hijo a tu cuenta. Él es el único que puede hacer esa configuración.</p>
                </div>
              }
            </div>

            <div class="accordion-item">
              <button class="accordion-header" [class.active]="openSection === 'mensualidades'" (click)="toggleSection('mensualidades')">
                <div class="accordion-title"><span class="accordion-icon">📅</span><span>Mensualidades</span></div>
                <span class="accordion-arrow" [class.open]="openSection === 'mensualidades'">▶</span>
              </button>
              @if (openSection === 'mensualidades') {
                <div class="accordion-body">
                  <p>En la pestaña <strong>Mensualidades</strong> del detalle de tu hijo ves el estado de cada cuota mensual.</p>
                  <h4>Estados posibles</h4>
                  <ul>
                    <li><strong style="color:#166534">Pagado:</strong> La mensualidad está completamente cubierta.</li>
                    <li><strong style="color:#854d0e">Pendiente / Parcial:</strong> Aún no se ha pagado o fue pagada solo en parte.</li>
                    <li><strong style="color:#991b1b">Vencido:</strong> La fecha límite de pago ya pasó y la mensualidad no está cubierta.</li>
                  </ul>
                  <h4>¿Puedo pagar desde aquí?</h4>
                  <p>No. Los pagos se registran en el club (presencialmente, Nequi, transferencia u otro método acordado). Una vez que el tesorero o administrador registre el pago, el estado se actualizará automáticamente en tu portal.</p>
                </div>
              }
            </div>

            <div class="accordion-item">
              <button class="accordion-header" [class.active]="openSection === 'pagos'" (click)="toggleSection('pagos')">
                <div class="accordion-title"><span class="accordion-icon">💰</span><span>Historial de Pagos</span></div>
                <span class="accordion-arrow" [class.open]="openSection === 'pagos'">▶</span>
              </button>
              @if (openSection === 'pagos') {
                <div class="accordion-body">
                  <p>En la pestaña <strong>Historial de Pagos</strong> ves todos los pagos registrados para tu hijo, ordenados del más reciente al más antiguo.</p>
                  <h4>¿Qué información aparece?</h4>
                  <ul>
                    <li>Fecha del pago, número de recibo, período al que corresponde, método y monto.</li>
                    <li>Los pagos <strong>anulados</strong> aparecen en gris tachado — fueron registrados por error y no cuentan.</li>
                  </ul>
                  <h4>Descargar recibo PDF</h4>
                  <ol>
                    <li>Ubica el pago en la tabla.</li>
                    <li>Haz clic en el botón <strong>📄 Recibo</strong>.</li>
                    <li>El archivo PDF se descargará automáticamente a tu dispositivo.</li>
                  </ol>
                  <h4>Descargar comprobante</h4>
                  <p>Si el club adjuntó un comprobante (foto de consignación, captura de transferencia, etc.), verás el botón <strong>📥 Comprobante</strong> junto al pago. Haz clic para descargarlo.</p>
                </div>
              }
            </div>

            <div class="accordion-item">
              <button class="accordion-header" [class.active]="openSection === 'contacto'" (click)="toggleSection('contacto')">
                <div class="accordion-title"><span class="accordion-icon">📞</span><span>Preguntas frecuentes</span></div>
                <span class="accordion-arrow" [class.open]="openSection === 'contacto'">▶</span>
              </button>
              @if (openSection === 'contacto') {
                <div class="accordion-body">
                  <h4>¿Cómo pago la mensualidad?</h4>
                  <p>Comunícate directamente con el club para conocer los métodos de pago aceptados (efectivo, Nequi, transferencia, etc.). Una vez realizado el pago, el tesorero lo registrará en el sistema.</p>
                  <h4>¿Por qué aparece una mensualidad como vencida si ya pagué?</h4>
                  <p>El pago puede no haber sido registrado aún en el sistema. Comunícate con el administrador o tesorero del club y proporciona tu comprobante de pago.</p>
                  <h4>¿Puedo cambiar mi contraseña?</h4>
                  <p>Sí. Comunícate con el administrador del club para que actualice tu contraseña de acceso.</p>
                  <h4>¿Cómo cierro sesión?</h4>
                  <p>Haz clic en tu nombre en la barra superior y selecciona <strong>"Cerrar sesión"</strong>.</p>
                </div>
              }
            </div>

          </div>
          }

          <!-- ===== AYUDA STAFF ===== -->
          @if (!isAcudiente()) {
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

                  <h4>Escanear documento de identidad (IA) ✨</h4>
                  <p>El formulario de nuevo jugador incluye un botón <strong>"📷 Escanear documento de identidad"</strong> que usa inteligencia artificial (Google Gemini) para leer una foto del documento y pre-llenar automáticamente los campos del formulario.</p>

                  <h4>Cómo usarlo</h4>
                  <ol>
                    <li>Haz clic en <strong>"Nuevo Jugador"</strong>.</li>
                    <li>Haz clic en el botón <strong>"📷 Escanear documento de identidad"</strong> en la parte superior del formulario.</li>
                    <li>Selecciona una <strong>fotocopia o foto del documento</strong> (CC, TI, CE) desde tu computadora, o toma la foto directamente con la cámara del celular.</li>
                    <li>Espera unos segundos mientras el sistema extrae los datos automáticamente.</li>
                    <li>Los campos <strong>nombre, apellido, tipo de documento, número de documento y fecha de nacimiento</strong> se pre-llenan solos.</li>
                    <li>Aparece un banner verde <em>"✓ Datos extraídos del documento"</em> como confirmación.</li>
                    <li>Revisa los datos, completa <strong>teléfono y categoría</strong> (obligatorios, no están en el documento), y guarda normalmente.</li>
                  </ol>
                  <div class="info-note">
                    💡 Los datos pre-llenados son totalmente editables. Si el sistema no pudo leer algún campo con certeza, quedará vacío para completarlo manualmente. Formatos aceptados: JPG, PNG, WEBP (máximo 5MB).
                  </div>

                  <h4>Requisito: configurar Google AI Studio</h4>
                  <p>Esta función utiliza la API de <strong>Google Gemini</strong> (inteligencia artificial de Google). Para activarla se necesita una cuenta con método de pago registrado. Si no está configurada, al escanear aparecerá un mensaje de error y los datos deberán ingresarse manualmente.</p>
                  <ol>
                    <li>Entra a <strong>aistudio.google.com</strong> con tu cuenta de Google.</li>
                    <li>Ve a <strong>"Get API key"</strong> y crea una nueva API key.</li>
                    <li>En <strong>Google Cloud Console</strong> (console.cloud.google.com), habilita la facturación del proyecto y agrega un método de pago (tarjeta de crédito o débito).</li>
                    <li>Copia la API key y configúrala en el servidor (variable de entorno <code>GEMINI_API_KEY</code>).</li>
                  </ol>

                  <h4>¿Cuánto cuesta?</h4>
                  <p>El modelo Gemini cobra <strong>por uso</strong>, no por suscripción mensual fija. Los costos son muy bajos para el volumen de un club deportivo:</p>
                  <ul>
                    <li>Cada escaneo de documento cuenta como una solicitud con imagen. El costo aproximado es de <strong>USD $0.10 por cada 1.000 imágenes</strong> procesadas.</li>
                    <li>Si el club registra <strong>100 jugadores nuevos al año</strong>, el costo total anual sería de apenas <strong>~USD $0.01</strong> (menos de un centavo).</li>
                    <li>Incluso registrando 1.000 jugadores nuevos en un año, el costo total sería de <strong>~USD $0.10</strong>.</li>
                    <li>Google solo cobra lo que se consume — si no se usa, no se paga nada.</li>
                  </ul>
                  <div class="info-note">
                    💡 La tarjeta de crédito se registra como garantía, pero con el volumen típico de un club el cobro mensual real será de centavos o incluso cero si no se registraron jugadores ese mes.
                  </div>

                  <h4>Crear jugador manualmente</h4>
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
                    Si el jugador tiene correo electrónico registrado, recibirá una notificación de la mensualidad generada. Si no tiene correo, el registro continúa normalmente sin enviar notificación.
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
                    <li>Si el jugador tiene correo electrónico registrado (propio o del acudiente), recibirá una notificación de la nueva mensualidad y un recordatorio 2 días antes del vencimiento. Si no tiene correo, el sistema omite la notificación sin afectar el proceso.</li>
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
          }

        </main>
      </div>
    </div>
  `,
  styleUrl: './ayuda.component.css'
})
export class AyudaComponent {
  private authService = inject(AuthService);

  openSection: string | null = null;

  isAcudiente(): boolean {
    return this.authService.hasRole(['acudiente']);
  }

  toggleSection(section: string): void {
    this.openSection = this.openSection === section ? null : section;
  }
}
