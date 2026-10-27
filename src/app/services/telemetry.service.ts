import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HistoricalSummary, HourlyBlockSummary, Summary24h, TelemetryLive } from '../models/telemetry.model';

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/telemetria`;

  getLive(idPaciente: number): Observable<TelemetryLive> {
    return this.http.get<TelemetryLive>(`${this.baseUrl}/paciente/${idPaciente}/en-vivo`);
  }

  getSummary24h(idPaciente: number): Observable<Summary24h> {
    return this.http.get<Summary24h>(`${this.baseUrl}/paciente/${idPaciente}/resumen-24h`);
  }

  getHourlyBlock(idPaciente: number, bloque: string, fecha?: string): Observable<HourlyBlockSummary> {
    let params = new HttpParams().set('bloque', bloque);
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    return this.http.get<HourlyBlockSummary>(`${this.baseUrl}/paciente/${idPaciente}/bloque-horario`, { params });
  }

  getHistorical(idPaciente: number, agrupacion: string, inicio?: string, fin?: string): Observable<HistoricalSummary> {
    let params = new HttpParams().set('agrupacion', agrupacion);
    if (inicio) {
      params = params.set('inicio', inicio);
    }
    if (fin) {
      params = params.set('fin', fin);
    }
    return this.http.get<HistoricalSummary>(`${this.baseUrl}/paciente/${idPaciente}/historico`, { params });
  }
}
