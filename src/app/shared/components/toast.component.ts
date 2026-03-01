import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-live="polite" aria-label="Notificaciones">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast toast--{{ toast.type }}"
          role="alert"
          [attr.aria-label]="toast.message"
        >
          <span class="toast__icon">{{ icon(toast.type) }}</span>
          <span class="toast__message">{{ toast.message }}</span>
          <button
            class="toast__close"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Cerrar notificación"
          >✕</button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast.component.css'
})
export class ToastComponent {
  toastService = inject(ToastService);

  icon(type: string): string {
    const icons: Record<string, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] ?? 'ℹ️';
  }
}
