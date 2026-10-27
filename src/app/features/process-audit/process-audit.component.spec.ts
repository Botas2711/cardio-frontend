import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProcessAuditComponent } from './process-audit.component';
import { ProcessMiningService } from '../../services/process-mining.service';
import { of, throwError } from 'rxjs';
import { TelemetryFlow } from '../../models/process-event.model';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ProcessAuditComponent', () => {
  let component: ProcessAuditComponent;
  let fixture: ComponentFixture<ProcessAuditComponent>;
  let mockProcessService: { getTelemetryFlow: any };

  const mockGeneralFlow: TelemetryFlow = {
    titulo: 'Flujo de Telemetría',
    subtitulo: 'Monitoreo de tiempos',
    filtroRiesgoAlto: false,
    kpi1Titulo: 'Eventos Telemétricos',
    kpi1Valor: '1,420',
    kpi2Titulo: 'Cumplimiento SLA',
    kpi2Valor: '85%',
    kpi2Color: '#E11D48',
    nodos: [
      { paso: 1, idActividad: 'CAPTURA_INICIADA', titulo: '1. Captura Iniciada', subtitulo: 'Transmisión PPG - App' },
      { paso: 2, idActividad: 'INFERENCIA_IA_COMPLETADA', titulo: '2. Inferencia IA', subtitulo: 'Clasificación - FastAPI' },
      { paso: 3, idActividad: 'ALERTA_DESPACHADA', titulo: '3. Alerta Despachada', subtitulo: 'Notificación - Spring Boot' },
      { paso: 4, idActividad: 'REVISION_MEDICA_CERRADA', titulo: '4. Revisión Médica Cerrada', subtitulo: 'Intervención' }
    ],
    transiciones: [
      { origen: 'CAPTURA_INICIADA', destino: 'INFERENCIA_IA_COMPLETADA', duracionMs: 120, tiempoTexto: '120 ms', etiqueta: '120 ms', estadoConformidad: 'CONFORME', color: '#94A3B8', esCritico: false },
      { origen: 'INFERENCIA_IA_COMPLETADA', destino: 'ALERTA_DESPACHADA', duracionMs: 45, tiempoTexto: '45 ms', etiqueta: '45 ms', estadoConformidad: 'CONFORME', color: '#94A3B8', esCritico: false },
      { origen: 'ALERTA_DESPACHADA', destino: 'REVISION_MEDICA_CERRADA', duracionMs: 2700000, tiempoTexto: '45 min', etiqueta: 'Desviación: Demora Humana 45 min', estadoConformidad: 'DESVIACION', color: '#E11D48', esCritico: false }
    ]
  };

  const mockCriticalFlow: TelemetryFlow = {
    titulo: 'Flujo de Telemetría',
    subtitulo: 'Filtro activo para situaciones críticas',
    filtroRiesgoAlto: true,
    kpi1Titulo: 'Alertas Críticas Procesadas',
    kpi1Valor: '18',
    kpi2Titulo: 'SLA Crítico Alcanzado',
    kpi2Valor: '100%',
    kpi2Color: '#10B981',
    nodos: mockGeneralFlow.nodos,
    transiciones: [
      { origen: 'CAPTURA_INICIADA', destino: 'INFERENCIA_IA_COMPLETADA', duracionMs: 120, tiempoTexto: '120 ms', etiqueta: '120 ms', estadoConformidad: 'CONFORME', color: '#10B981', esCritico: true },
      { origen: 'INFERENCIA_IA_COMPLETADA', destino: 'ALERTA_DESPACHADA', duracionMs: 45, tiempoTexto: '45 ms', etiqueta: '45 ms', estadoConformidad: 'CONFORME', color: '#10B981', esCritico: true },
      { origen: 'ALERTA_DESPACHADA', destino: 'REVISION_MEDICA_CERRADA', duracionMs: 120000, tiempoTexto: '2 min', etiqueta: 'Conforme: 2 min', estadoConformidad: 'CONFORME', color: '#10B981', esCritico: true }
    ]
  };

  beforeEach(async () => {
    mockProcessService = {
      getTelemetryFlow: vi.fn().mockReturnValue(of(mockGeneralFlow))
    };

    await TestBed.configureTestingModule({
      imports: [ProcessAuditComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProcessMiningService, useValue: mockProcessService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessAuditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse exitosamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar el flujo general por defecto con 4 nodos y 3 transiciones', () => {
    expect(component.isHighRiskFilterActive).toBe(false);
    expect(component.telemetryFlow.kpi1Titulo).toBe('Eventos Telemétricos');
    expect(component.telemetryFlow.kpi1Valor).toBe('1,420');
    expect(component.telemetryFlow.kpi2Titulo).toBe('Cumplimiento SLA');
    expect(component.telemetryFlow.kpi2Valor).toBe('85%');
    expect(component.telemetryFlow.nodos.length).toBe(4);
    expect(component.telemetryFlow.transiciones[2].estadoConformidad).toBe('DESVIACION');
  });

  it('debe alternar a flujo crítico al presionar el filtro de Riesgo Alto', () => {
    mockProcessService.getTelemetryFlow.mockReturnValue(of(mockCriticalFlow));

    component.toggleHighRiskFilter();
    fixture.detectChanges();

    expect(component.isHighRiskFilterActive).toBe(true);
    expect(component.telemetryFlow.kpi1Titulo).toBe('Alertas Críticas Procesadas');
    expect(component.telemetryFlow.kpi1Valor).toBe('18');
    expect(component.telemetryFlow.kpi2Titulo).toBe('SLA Crítico Alcanzado');
    expect(component.telemetryFlow.kpi2Valor).toBe('100%');
    expect(component.telemetryFlow.transiciones[2].estadoConformidad).toBe('CONFORME');
    expect(component.telemetryFlow.transiciones[2].etiqueta).toBe('Conforme: 2 min');
  });

  it('debe mantener datos por defecto si el servicio falla por red', () => {
    mockProcessService.getTelemetryFlow.mockReturnValue(throwError(() => new Error('Error de conexión')));

    component.isHighRiskFilterActive = false;
    component.loadTelemetryData();
    fixture.detectChanges();

    expect(component.telemetryFlow).toBeDefined();
    expect(component.telemetryFlow.nodos.length).toBe(4);
    expect(component.telemetryFlow.kpi1Valor).toBe('1,420');
  });
});
