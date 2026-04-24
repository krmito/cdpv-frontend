import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar.component';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, SidebarComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  form = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  loading = false;
  isExpired = false;
  errors: Record<string, string> = {};

  ngOnInit() {
    this.authService.getPasswordStatus().subscribe({
      next: (status) => { this.isExpired = status.expirado; },
      error: () => {}
    });
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.currentPassword) this.errors['currentPassword'] = 'Ingresa tu contraseña actual';
    if (!this.form.newPassword) this.errors['newPassword'] = 'Ingresa la nueva contraseña';
    else if (this.form.newPassword.length < 8) this.errors['newPassword'] = 'Mínimo 8 caracteres';
    else if (this.form.newPassword === this.form.currentPassword) this.errors['newPassword'] = 'La nueva contraseña debe ser diferente a la actual';
    if (!this.form.confirmPassword) this.errors['confirmPassword'] = 'Confirma la nueva contraseña';
    else if (this.form.confirmPassword !== this.form.newPassword) this.errors['confirmPassword'] = 'Las contraseñas no coinciden';
    return Object.keys(this.errors).length === 0;
  }

  submit() {
    if (!this.validate()) return;
    this.loading = true;
    this.authService.changePassword(this.form.currentPassword, this.form.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Contraseña actualizada exitosamente');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err?.error?.message || 'Error al cambiar la contraseña';
        this.toast.error(msg);
      }
    });
  }
}
