import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProcessAuditComponent } from './process-audit.component';
import { ProcessMiningService } from '../../services/process-mining.service';
import { of, throwError } from 'rxjs';
import { TelemetryFlow, ProcessMap, ProcessTimes, ConformityReport } from '../../models/process-event.model';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ProcessAuditComponent', () => {
  let component: ProcessAuditComponent;
  let fixture: ComponentFixture<ProcessAuditComponent>;
  let mockProcessService: any;

  const mockGeneralFlow: TelemetryFlow = {
    titulo: 'Flujo de Telemetría (PM4Py)',
    subtitulo: 'Monitoreo de tiempos y rendimiento',
    filtroRiesgoAlto: false,
    kpi1Titulo: 'Eventos Telemétricos',
    kpi1Valor: '100',
    kpi2Titulo: 'Cumplimiento SLA',
    kpi2Valor: '100%',
    kpi2Color: '#10B981',
    nodos: [
      { paso: 1, idActividad: 'CAPTURA_INICIADA', titulo: '1. Captura Iniciada', subtitulo: 'Transmisión PPG - App' },
      { paso: 2, idActividad: 'INFERENCIA_IA_COMPLETADA', titulo: '2. Inferencia IA', subtitulo: 'Clasificación - FastAPI' },
      { paso: 3, idActividad: 'ALERTA_DESPACHADA', titulo: '3. Alerta Despachada', subtitulo: 'Notificación - Spring Boot' },
      { paso: 4, idActividad: 'REVISION_MEDICA_CERRADA', titulo: '4. Revisión Médica Cerrada', subtitulo: 'Intervención' }
    ],
    transiciones: [
      { origen: 'CAPTURA_INICIADA', destino: 'INFERENCIA_IA_COMPLETADA', duracionMs: 120, tiempoTexto: '120 ms', etiqueta: '120 ms', estadoConformidad: 'CONFORME', color: '#10B981', esCritico: false },
      { origen: 'INFERENCIA_IA_COMPLETADA', destino: 'ALERTA_DESPACHADA', duracionMs: 45, tiempoTexto: '45 ms', etiqueta: '45 ms', estadoConformidad: 'CONFORME', color: '#10B981', esCritico: false },
      { origen: 'ALERTA_DESPACHADA', destino: 'REVISION_MEDICA_CERRADA', duracionMs: 120000, tiempoTexto: '2 min', etiqueta: 'Conforme: 2 min', estadoConformidad: 'CONFORME', color: '#10B981', esCritico: false }
    ]
  };

  const mockCriticalFlow: TelemetryFlow = {
    ...mockGeneralFlow,
    filtroRiesgoAlto: true,
    kpi1Titulo: 'Alertas Críticas Procesadas',
    kpi1Valor: '2'
  };

  const mockProcessMap: ProcessMap = {
    totalCasos: 49,
    actividades: [
      { actividad: 'CAPTURA_INICIADA', cantidadPacientes: 1, totalOcurrencias: 49 },
      { actividad: 'INFERENCIA_IA_COMPLETADA', cantidadPacientes: 1, totalOcurrencias: 49 },
      { actividad: 'ALERTA_DESPACHADA', cantidadPacientes: 1, totalOcurrencias: 2 }
    ],
    transiciones: [
      { origen: 'CAPTURA_INICIADA', destino: 'INFERENCIA_IA_COMPLETADA', cantidadCasos: 49 },
      { origen: 'INFERENCIA_IA_COMPLETADA', destino: 'ALERTA_DESPACHADA', cantidadCasos: 2 }
    ],
    mensaje: 'Grafo asistencial descubierto exitosamente con PM4Py'
  };

  const mockProcessTimes: ProcessTimes = {
    pasos: [
      {
        etapaOrigen: 'CAPTURA_INICIADA',
        etapaDestino: 'INFERENCIA_IA_COMPLETADA',
        duracionPromedioMinutos: 0.002,
        duracionLimiteNormalMinutos: 0.033,
        demorado: false,
        colorAlerta: 'VERDE',
        mensajeEstado: 'Tiempo óptimo dentro de los límites clínicos'
      }
    ],
    estadoGeneral: 'OPTIMO',
    mensaje: 'Todas las etapas se cumplen dentro de los límites'
  };

  const mockConformity: ConformityReport = {
    porcentajeCumplimiento: 100.0,
    totalCasos: 49,
    casosConformes: 49,
    casosConDesvios: 0,
    mensaje: 'Cumplimiento total de la ruta clínica (100%).',
    casosIncompletos: []
  };

  beforeEach(async () => {
    mockProcessService = {
      getProcessMap: vi.fn().mockReturnValue(of(mockProcessMap)),
      getProcessTimes: vi.fn().mockReturnValue(of(mockProcessTimes)),
      getConformityReport: vi.fn().mockReturnValue(of(mockConformity)),
      getTelemetryFlow: vi.fn().mockReturnValue(of(mockGeneralFlow)),
      getEventos: vi.fn().mockReturnValue(of(new Array(100).fill({ idEvento: 1 })))
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

  it('debe cargar los datos reales de PM4Py y la BD al inicializarse', () => {
    expect(component.filtroRiesgo).toBe('TODOS');
    expect(component.totalEventosRegistrados).toBe(100);
    expect(component.processMap?.totalCasos).toBe(49);
    expect(component.processTimes?.estadoGeneral).toBe('OPTIMO');
    expect(component.conformityReport?.porcentajeCumplimiento).toBe(100.0);
  });

  it('debe cambiar de filtro de riesgo y recargar datos', () => {
    component.setFiltroRiesgo('CRITICO');
    fixture.detectChanges();

    expect(component.filtroRiesgo).toBe('CRITICO');
    expect(component.isHighRiskFilterActive).toBe(true);
    expect(mockProcessService.getProcessMap).toHaveBeenCalledWith('CRITICO');
  });

  it('debe alternar entre pestañas de auditoría correctamente', () => {
    expect(component.activeTab).toBe('mapa');

    component.setActiveTab('tiempos');
    expect(component.activeTab).toBe('tiempos');

    component.setActiveTab('conformidad');
    expect(component.activeTab).toBe('conformidad');
  });

  it('debe manejar errores de conexión sin quebrar la interfaz', () => {
    mockProcessService.getProcessMap.mockReturnValue(throwError(() => new Error('Error de red')));
    mockProcessService.getEventos.mockReturnValue(throwError(() => new Error('Error de red')));

    component.loadAllProcessData();
    fixture.detectChanges();

    expect(component.processMap).toBeNull();
    expect(component.totalEventosRegistrados).toBe(0);
  });
});
