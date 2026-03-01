import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="header-bg"></div>
      <div class="header-content">
        <div class="header-text">
          <h1>
            <span class="header-icon">{{ icon }}</span>
            {{ title }}
          </h1>
          <p class="header-subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="header-decoration">
        <div class="line l1"></div>
        <div class="line l2"></div>
      </div>
    </div>
  `,
  styleUrl: './page-header.component.css'
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = '';
}
