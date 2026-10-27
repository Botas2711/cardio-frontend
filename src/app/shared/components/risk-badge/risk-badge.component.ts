import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskLevel } from '../../../models/patient.model';

@Component({
  selector: 'app-risk-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      [ngClass]="{
        'bg-red-100 text-red-800 border-red-300': level === 'CRITICO',
        'bg-amber-100 text-amber-800 border-amber-300': level === 'MODERADO',
        'bg-emerald-100 text-emerald-800 border-emerald-300': level === 'NORMAL' || !level
      }"
      class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
    >
      <span
        [ngClass]="{
          'bg-red-500': level === 'CRITICO',
          'bg-amber-500': level === 'MODERADO',
          'bg-emerald-500': level === 'NORMAL' || !level
        }"
        class="w-2 h-2 rounded-full mr-1.5 animate-pulse"
      ></span>
      {{ label || level || 'NORMAL' }}
    </span>
  `
})
export class RiskBadgeComponent {
  @Input() level: RiskLevel | string = 'NORMAL';
  @Input() label?: string;
}
