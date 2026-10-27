import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Alert, AlertAttendRequest, AlertExplanation } from '../models/alert.model';

@Injectable({
  providedIn: 'root'
})
export class XaiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/alertas`;

  getShapExplanation(idAlerta: number): Observable<AlertExplanation> {
    return this.http.get<AlertExplanation>(`${this.baseUrl}/${idAlerta}/explicacion`);
  }

  attendAlert(idAlerta: number, request: AlertAttendRequest): Observable<Alert> {
    return this.http.put<Alert>(`${this.baseUrl}/${idAlerta}/atender`, request);
  }

  getPatientAlerts(idPaciente: number): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.baseUrl}/paciente/${idPaciente}`);
  }
}
