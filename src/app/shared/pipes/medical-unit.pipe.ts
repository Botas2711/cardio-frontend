import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'medicalUnit',
  standalone: true
})
export class MedicalUnitPipe implements PipeTransform {
  transform(value: number | string | null | undefined, unit: 'ppm' | 'mmHg' | 'score'): string {
    if (value === null || value === undefined || value === '') {
      return '--';
    }
    if (unit === 'score') {
      const num = typeof value === 'number' ? value : parseFloat(value);
      return isNaN(num) ? '--' : `${(num * 100).toFixed(1)}%`;
    }
    return `${value} ${unit}`;
  }
}
