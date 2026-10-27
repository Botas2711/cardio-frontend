import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Patient, PatientCreateRequest, PatientTriage, ThresholdUpdateRequest } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/pacientes`;

  getTriage(query?: string, nivelRiesgo?: string): Observable<PatientTriage[]> {
    let params = new HttpParams();
    if (query && query.trim() !== '') {
      params = params.set('query', query.trim());
    }
    if (nivelRiesgo && nivelRiesgo !== 'TODOS') {
      params = params.set('nivelRiesgo', nivelRiesgo);
    }
    return this.http.get<PatientTriage[]>(`${environment.apiUrl}/triage`, { params });
  }

  getAll(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.baseUrl);
  }

  getById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/${id}`);
  }

  create(patient: PatientCreateRequest): Observable<Patient> {
    return this.http.post<Patient>(this.baseUrl, patient);
  }

  updateThresholds(id: number, thresholds: ThresholdUpdateRequest): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/${id}/umbrales`, thresholds);
  }

  verificarDni(dni: string): Observable<{ existe: boolean }> {
    return this.http.get<{ existe: boolean }>(`${this.baseUrl}/verificar-dni/${encodeURIComponent(dni.trim())}`);
  }
}
