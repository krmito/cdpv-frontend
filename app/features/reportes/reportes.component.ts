import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar.component';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  template: `
    <div class="layout">
      <app-navbar/>
      <div class="main-container">
        <app-sidebar/>
        <main class="content">
          <h1>📈 Reportes</h1>
          <div class="placeholder-card">
            <h2>Módulo en Construcción</h2>
            <p>Este módulo está disponible en los documentos FRONTEND-ANGULAR-PARTE-3-FINAL.md</p>
            <p>Funcionalidades que incluirá:</p>
            <ul>
              <li>✅ Reporte de caja por período</li>
              <li>✅ Lista de jugadores morosos con deuda total</li>
              <li>✅ Proyección de ingresos mensuales</li>
              <li>✅ Cumplimiento de pago por categoría</li>
              <li>✅ Estadísticas generales del sistema</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout { display: flex; flex-direction: column; height: 100vh; }
    .main-container { display: flex; flex: 1; overflow: hidden; }
    .content { flex: 1; padding: 32px; overflow-y: auto; background: #f5f7fa; }
    h1 { margin-bottom: 24px; color: #111827; }
    .placeholder-card {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .placeholder-card h2 {
      color: #8b5cf6;
      margin-top: 0;
    }
    .placeholder-card ul {
      margin-top: 16px;
      padding-left: 24px;
    }
    .placeholder-card li {
      margin: 8px 0;
    }
  `]
})
export class ReportesComponent {}
