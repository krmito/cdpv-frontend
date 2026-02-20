import { CanDeactivateFn } from '@angular/router';

export interface CanComponentDeactivate {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (component.hasUnsavedChanges && component.hasUnsavedChanges()) {
    return window.confirm('Tienes cambios sin guardar. ¿Deseas salir y descartar los cambios?');
  }
  return true;
};
