import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConformityReport, EventoProcesoItem, ProcessMap, ProcessTimes, TelemetryFlow } from '../models/process-event.model';

@Injectable({
  providedIn: 'root'
})
export class ProcessMiningService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/procesos`;

  getTelemetryFlow(riesgoAlto: boolean = false): Observable<TelemetryFlow> {
    const params = new HttpParams().set('riesgoAlto', riesgoAlto.toString());
    return this.http.get<TelemetryFlow>(`${this.baseUrl}/flujo-telemetria`, { params });
  }

  getEventos(filtroRiesgo?: string): Observable<EventoProcesoItem[]> {
    let params = new HttpParams();
    if (filtroRiesgo && filtroRiesgo !== 'TODOS') {
      params = params.set('filtroRiesgo', filtroRiesgo);
    }
    return this.http.get<EventoProcesoItem[]>(`${this.baseUrl}/eventos`, { params });
  }

  registrarEvento(request: { idPaciente: number; actividad: string; ejecutor?: string; estadoConformidad?: string; fechaInicio?: string; fechaFin?: string }): Observable<EventoProcesoItem> {
    return this.http.post<EventoProcesoItem>(`${this.baseUrl}/eventos`, request);
  }

  getProcessMap(filtroRiesgo?: string): Observable<ProcessMap> {
    let params = new HttpParams();
    if (filtroRiesgo && filtroRiesgo !== 'TODOS') {
      params = params.set('filtroRiesgo', filtroRiesgo);
    }
    return this.http.get<ProcessMap>(`${this.baseUrl}/mapa`, { params });
  }

  getProcessTimes(filtroRiesgo?: string): Observable<ProcessTimes> {
    let params = new HttpParams();
    if (filtroRiesgo && filtroRiesgo !== 'TODOS') {
      params = params.set('filtroRiesgo', filtroRiesgo);
    }
    return this.http.get<ProcessTimes>(`${this.baseUrl}/tiempos-espera`, { params });
  }

  getConformityReport(filtroRiesgo?: string): Observable<ConformityReport> {
    let params = new HttpParams();
    if (filtroRiesgo && filtroRiesgo !== 'TODOS') {
      params = params.set('filtroRiesgo', filtroRiesgo);
    }
    return this.http.get<ConformityReport>(`${this.baseUrl}/conformidad`, { params });
  }
}
