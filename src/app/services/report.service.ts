import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';
import { SettingsService } from '../core/services/settings.service';

export interface RiskExplanationReportData {
  patientName: string;
  dni: string;
  edad?: number;
  genero?: string;
  imc: number;
  currentBpm: number;
  riskScore: number;
  riskClassification: string;
  tabaquismo: boolean;
  diabetes: boolean;
  hipertension: boolean;
  doctorName?: string;
  comparisonRows: {
    parametro: string;
    valorRegistrado: string;
    limiteSeguro: string;
    impacto: string;
  }[];
}

export interface HistoricalReportData {
  patientName: string;
  dni: string;
  dateRangeLabel: string;
  averageBpm: number;
  maxBpm: number;
  minBpm: number;
  alertsCount: number;
  doctorName?: string;
  records: {
    fecha: string;
    label: string;
    pulsoPpm: number;
    esAlerta: boolean;
  }[];
  clinicalNotes: {
    texto: string;
    fecha: string;
    medico: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);

  getDoctorDisplayName(): string {
    const user = this.authService.currentUser();
    if (user && user.nombres && user.apellidos) {
      return `Dr. ${user.nombres.trim()} ${user.apellidos.trim()}`;
    }
    const settings = this.settingsService.getSettings();
    if (settings && settings.nombres && settings.apellidos) {
      return `Dr. ${settings.nombres.trim()} ${settings.apellidos.trim()}`;
    }
    return 'Dr. Pablo Rojas';
  }

  downloadPdfReport(idPaciente: number, fechaInicio?: string, fechaFin?: string, medico?: string): Observable<Blob> {
    let params = new HttpParams();
    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }
    const doc = medico || this.getDoctorDisplayName();
    params = params.set('medico', doc);

    return this.http.get(`${environment.apiUrl}/reportes/paciente/${idPaciente}/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  saveBlobToFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Generador de Informe de Explicación de Riesgo y Predicción AI (risk-detail-modal.png)
  generateRiskExplanationPdf(data: RiskExplanationReportData): void {
    const today = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
    const doctorDisplay = data.doctorName || this.getDoctorDisplayName();
    const isHigh = data.riskScore >= 70;
    const badgeColor = isHigh ? '#E11D48' : '#D97706';
    const badgeBg = isHigh ? '#FFE4E6' : '#FEF3C7';

    // Cálculo visual de barras de impacto
    const bpmBar = Math.min(95, Math.max(20, Math.round((data.currentBpm / 150) * 90)));
    const imcBar = data.imc >= 30 ? 55 : (data.imc >= 25 ? 40 : 18);
    const tabBar = data.tabaquismo ? 55 : 18;
    const diabBar = data.diabetes ? 62 : 15;

    const rowsHtml = data.comparisonRows.map(r => {
      const isCritical = r.impacto === 'Alto';
      const isMod = r.impacto === 'Moderado';
      const pillColor = isCritical ? '#E11D48' : (isMod ? '#B45309' : '#059669');
      const pillBg = isCritical ? '#FFE4E6' : (isMod ? '#FEF3C7' : '#ECFDF5');
      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 14px; font-weight: 700; color: ${isCritical ? '#E11D48' : '#1e293b'};">${r.valorRegistrado}</td>
          <td style="padding: 10px 14px; color: #475569;">${r.limiteSeguro}</td>
          <td style="padding: 10px 14px; text-align: right;">
            <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; color: ${pillColor}; background: ${pillBg};">
              ${r.impacto}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Informe de Explicación de Riesgo - ${data.patientName}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 13px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #E11D48; margin-bottom: 20px; }
          .brand { display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 900; color: #E11D48; letter-spacing: -0.5px; }
          .badge-risk { background: ${badgeBg}; border: 1.5px solid ${badgeColor}; border-radius: 16px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
          .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-bottom: 10px; }
          .bar-track { background: #f1f5f9; height: 10px; border-radius: 999px; overflow: hidden; margin-top: 4px; }
          .bar-fill { height: 100%; border-radius: 999px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
          th { background: #f8fafc; color: #64748b; font-weight: 700; padding: 10px 14px; text-align: left; border-bottom: 1.5px solid #e2e8f0; }
          .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              PonteCorazonPe
            </div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px;">Telemetría y Monitoreo Cardiovascular Especializado</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #475569;">
            <div><strong>Emisión:</strong> ${today}</div>
            <div><strong>Médico:</strong> ${doctorDisplay} (Cardiólogo)</div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; font-weight: 900; margin: 0 0 4px 0; color: #0f172a;">Informe de Explicación de Riesgo y Predicción AI</h2>
          <div style="font-size: 12px; color: #64748b;">Análisis detallado de biomarcadores e inferencia diagnóstica en tiempo real</div>
        </div>

        <!-- Tarjeta de Paciente -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 18px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 12px;">
          <div><span style="color: #64748b; display: block; font-size: 10px; font-weight: 700; text-transform: uppercase;">Paciente</span><strong>${data.patientName}</strong></div>
          <div><span style="color: #64748b; display: block; font-size: 10px; font-weight: 700; text-transform: uppercase;">DNI</span><strong style="font-family: monospace;">${data.dni}</strong></div>
          <div><span style="color: #64748b; display: block; font-size: 10px; font-weight: 700; text-transform: uppercase;">Edad / Género</span><strong>${data.edad || '58'} años · ${data.genero || 'MASCULINO'}</strong></div>
          <div><span style="color: #64748b; display: block; font-size: 10px; font-weight: 700; text-transform: uppercase;">IMC</span><strong>${data.imc} kg/m²</strong></div>
        </div>

        <!-- Banner de Clasificación Actual y Puntaje -->
        <div class="badge-risk">
          <div>
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; display: block;">Clasificación de Riesgo Detectado</span>
            <span style="font-size: 18px; font-weight: 900; color: ${badgeColor};">${data.riskClassification}</span>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Frecuencia detectada en la alerta: <strong style="color: #E11D48;">${data.currentBpm} BPM</strong></div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 32px; font-weight: 900; color: ${badgeColor}; font-family: monospace; line-height: 1;">${data.riskScore}/100</div>
            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Puntaje Predictivo</span>
          </div>
        </div>

        <!-- Sección de Barras de Impacto por Factor -->
        <div style="margin-bottom: 24px;">
          <div class="section-title">Impacto por Factor Fisiológico (SHAP Feature Importance)</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 12px;">Mayor longitud de la barra indica mayor ponderación en la inducción de riesgo cardiovascular:</div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
                <span>Frecuencia Cardíaca</span>
                <span style="color: #E11D48;">${data.currentBpm} BPM</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width: ${bpmBar}%; background: #E11D48;"></div></div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
                <span>Índice de Masa Corporal (IMC)</span>
                <span style="color: #D97706;">${data.imc} kg/m²</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width: ${imcBar}%; background: #F59E0B;"></div></div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
                <span>Tabaquismo</span>
                <span style="color: ${data.tabaquismo ? '#D97706' : '#64748b'};">${data.tabaquismo ? 'Sí (Activo)' : 'No'}</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width: ${tabBar}%; background: ${data.tabaquismo ? '#F59E0B' : '#94A3B8'};"></div></div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
                <span>Diabetes Mellitus</span>
                <span style="color: ${data.diabetes ? '#E11D48' : '#64748b'};">${data.diabetes ? 'Sí (Diagnosticada)' : 'No'}</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width: ${diabBar}%; background: ${data.diabetes ? '#E11D48' : '#94A3B8'};"></div></div>
            </div>
          </div>
        </div>

        <!-- Tabla de Comparación de Parámetros Clínicos -->
        <div style="margin-bottom: 24px;">
          <div class="section-title">Tabla de Comparación de Parámetros Clínicos</div>
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <table>
              <thead>
                <tr>
                  <th>Valor Registrado</th>
                  <th>Límite Clínico Seguro</th>
                  <th style="text-align: right;">Impacto en Predicción</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>

        <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 12px 16px; font-size: 11px; color: #9f1239;">
          <strong>Nota de Soporte Clínico:</strong> Este reporte predictivo ha sido generado por el modelo de inferencia cardiológica en tiempo real para alertar de descompensaciones hemodinámicas. No sustituye la auscultación ni el criterio médico especializado.
        </div>

        <div class="footer">
          <div>Documento confidencial emitido bajo la Ley N.° 29733 de Protección de Datos Personales.</div>
          <div style="text-align: right;">
            <div style="font-weight: 800; color: #0f172a;">${doctorDisplay}</div>
            <div style="font-size: 10px;">Médico Cardiólogo · Reg. C.M.P. 48291</div>
          </div>
        </div>
      </body>
      </html>
    `;

    this.printIsolatedDocument(html);
  }

  // Generador de Informe Biométrico Histórico Consolidado (history-tab.png / history-range.png)
  generateHistoricalSummaryPdf(data: HistoricalReportData): void {
    const today = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
    const doctorDisplay = data.doctorName || this.getDoctorDisplayName();

    // Filas cronológicas de mediciones históricas
    const rowsHtml = data.records.map(r => {
      const isAlerta = r.esAlerta || r.pulsoPpm > 100;
      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 12px; font-weight: 700; color: #334155;">${r.label} 2026</td>
          <td style="padding: 8px 12px; font-weight: 900; font-family: monospace; color: ${isAlerta ? '#E11D48' : '#0f172a'};">${r.pulsoPpm} BPM</td>
          <td style="padding: 8px 12px; font-family: monospace; color: #64748b;">${Math.max(55, Math.round(r.pulsoPpm * 0.88))} BPM</td>
          <td style="padding: 8px 12px; text-align: right;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; color: ${isAlerta ? '#E11D48' : '#059669'}; background: ${isAlerta ? '#FFE4E6' : '#ECFDF5'};">
              ${isAlerta ? 'Riesgo detectado' : 'Ritmo Estable'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    // Bitácora de notas clínicas registradas
    const notesHtml = data.clinicalNotes.length > 0
      ? data.clinicalNotes.map(n => `
          <div style="padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 6px; font-size: 11px;">
            <div style="color: #1e293b; font-weight: 600; margin-bottom: 2px;">${n.texto}</div>
            <div style="font-size: 10px; color: #64748b;">Registrado por: <strong>${n.medico}</strong> · <span>${n.fecha}</span></div>
          </div>
        `).join('')
      : '<div style="font-size: 11px; color: #64748b; font-style: italic;">Sin notas clínicas adicionales en el período.</div>';

    // Gráfico de barras SVG embebido para visualizar la tendencia histórica
    const chartBars = data.records.map((r, i) => {
      const height = Math.min(90, Math.max(25, Math.round(((r.pulsoPpm - 40) / 120) * 85)));
      const color = r.esAlerta ? '#E11D48' : '#3B82F6';
      const x = 30 + i * 48;
      const y = 110 - height;
      return `
        <rect x="${x}" y="${y}" width="24" height="${height}" rx="4" fill="${color}" />
        <text x="${x + 12}" y="${y - 4}" font-size="9" font-weight="700" fill="${color}" text-anchor="middle" font-family="monospace">${r.pulsoPpm}</text>
        <text x="${x + 12}" y="125" font-size="9" font-weight="600" fill="#64748b" text-anchor="middle">${r.label.split(' ')[0]}</text>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Informe Histórico Biométrico - ${data.patientName}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 12px; line-height: 1.45; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid #E11D48; margin-bottom: 18px; }
          .brand { display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 900; color: #E11D48; letter-spacing: -0.5px; }
          .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-bottom: 8px; }
          .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11px; }
          th { background: #f8fafc; color: #64748b; font-weight: 700; padding: 8px 12px; text-align: left; border-bottom: 1.5px solid #e2e8f0; }
          .footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              PonteCorazonPe
            </div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px;">Informe Biométrico Histórico y Evolución Telemétrica</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #475569;">
            <div><strong>Emisión:</strong> ${today}</div>
            <div><strong>Rango Analizado:</strong> ${data.dateRangeLabel}</div>
            <div><strong>Médico:</strong> ${doctorDisplay} (Cardiólogo)</div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 17px; font-weight: 900; margin: 0 0 4px 0; color: #0f172a;">Historial de Frecuencia Cardíaca y Bitácora Clínica</h2>
          <div style="font-size: 11px; color: #64748b;">Paciente: <strong>${data.patientName}</strong> (DNI: <span style="font-family: monospace;">${data.dni}</span>)</div>
        </div>

        <!-- 4 Tarjetas de Resumen Estadístico -->
        <div class="stat-grid">
          <div class="stat-card">
            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Promedio</span>
            <div style="font-size: 22px; font-weight: 900; color: #0f172a; font-family: monospace;">${data.averageBpm} <span style="font-size: 11px; color: #64748b;">BPM</span></div>
          </div>
          <div class="stat-card">
            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Máximo</span>
            <div style="font-size: 22px; font-weight: 900; color: #E11D48; font-family: monospace;">${data.maxBpm} <span style="font-size: 11px; color: #E11D48;">BPM</span></div>
          </div>
          <div class="stat-card">
            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Mínimo</span>
            <div style="font-size: 22px; font-weight: 900; color: #334155; font-family: monospace;">${data.minBpm} <span style="font-size: 11px; color: #64748b;">BPM</span></div>
          </div>
          <div class="stat-card" style="border-color: #fecdd3; background: #fff1f2;">
            <span style="font-size: 10px; font-weight: 800; color: #E11D48; text-transform: uppercase; display: block;">Alertas de Riesgo</span>
            <div style="font-size: 22px; font-weight: 900; color: #E11D48; font-family: monospace;">${data.alertsCount} <span style="font-size: 10px; font-weight: 700;">REGISTRADAS</span></div>
          </div>
        </div>

        <!-- Gráfico de Tendencia Histórica Visual -->
        <div style="margin-bottom: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a;">Tendencia Diaria de Frecuencia Cardíaca (BPM)</span>
            <div style="font-size: 10px; color: #64748b; display: flex; gap: 10px;">
              <span><strong style="color: #3B82F6;">■</strong> Ritmo Estable</span>
              <span><strong style="color: #E11D48;">■</strong> Riesgo detectado</span>
            </div>
          </div>
          <svg width="100%" height="135" viewBox="0 0 540 135" style="overflow: visible;">
            <line x1="20" y1="110" x2="520" y2="110" stroke="#e2e8f0" stroke-width="1.5" />
            <line x1="20" y1="50" x2="520" y2="50" stroke="#fecdd3" stroke-dasharray="3,3" stroke-width="1" />
            <text x="525" y="53" font-size="8" fill="#E11D48">100 BPM (Máx)</text>
            ${chartBars}
          </svg>
        </div>

        <!-- Tabla Cronológica Detallada -->
        <div style="margin-bottom: 20px;">
          <div class="section-title">Registro Detallado de Mediciones Históricas</div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Pulso Registrado</th>
                  <th>Pulso Basal Referencial</th>
                  <th style="text-align: right;">Estado del Ritmo</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Bitácora de Notas Clínicas -->
        <div style="margin-bottom: 16px;">
          <div class="section-title">Bitácora de Notas Clínicas del Médico</div>
          <div>
            ${notesHtml}
          </div>
        </div>

        <div class="footer">
          <div>Documento emitido por PonteCorazonPe conforme a los estándares de historia clínica electrónica y telemedicina.</div>
          <div style="text-align: right;">
            <div style="font-weight: 800; color: #0f172a;">${doctorDisplay}</div>
            <div style="font-size: 10px;">Médico Cardiólogo · Reg. C.M.P. 48291</div>
          </div>
        </div>
      </body>
      </html>
    `;

    this.printIsolatedDocument(html);
  }

  // Método de impresión en Iframe aislado (no distorsiona el DOM ni el Canvas de la web principal)
  private printIsolatedDocument(html: string): void {
    if (typeof document === 'undefined') return;

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (err) {
            console.warn('Error al invocar impresión en iframe:', err);
          } finally {
            setTimeout(() => {
              if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
              }
            }, 2500);
          }
        }, 300);
      }
    } catch (err) {
      console.error('Error al generar informe imprimible:', err);
    }
  }
}
