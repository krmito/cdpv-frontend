import { Injectable, signal } from '@angular/core';
import { BREAKPOINTS } from '../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  /** Drawer abierto (móvil) */
  sidebarOpen = signal(false);
  /** Sidebar colapsado en desktop (solo íconos) */
  sidebarCollapsed = signal(true);

  /** Hamburger unificado: en móvil abre el drawer, en desktop colapsa/expande */
  toggleMenu() {
    if (window.innerWidth <= BREAKPOINTS.MOBILE) {
      this.sidebarOpen.update(v => !v);
    } else {
      this.sidebarCollapsed.update(v => !v);
    }
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  openSidebar() {
    this.sidebarOpen.set(true);
  }

  // Compat: usado internamente por algunos guards
  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }
}
