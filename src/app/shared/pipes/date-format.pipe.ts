import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'clinicalDate',
  standalone: true
})
export class ClinicalDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, includeTime: boolean = true): string {
    if (!value) return '--';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '--';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    if (!includeTime) {
      return `${day}/${month}/${year}`;
    }

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
}
