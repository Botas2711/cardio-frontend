import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PatientDetailComponent } from './patient-detail.component';
import { PatientService } from '../../../services/patient.service';
import { TelemetryService } from '../../../services/telemetry.service';
import { ReportService } from '../../../services/report.service';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('PatientDetailComponent', () => {
  let component: PatientDetailComponent;
  let fixture: ComponentFixture<PatientDetailComponent>;
  let mockPatientService: any;
  let mockTelemetryService: any;
  let mockReportService: any;

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  beforeEach(async () => {
    mockPatientService = {
      getById: vi.fn().mockReturnValue(of({
        idPaciente: 3,
        dni: '14567892',
        nombres: 'Agustín',
        apellidos: 'Aguilar',
        frecuenciaMin: 60,
        frecuenciaMax: 100,
        imc: 31,
        diabetes: true
      })),
      updateThresholds: vi.fn().mockReturnValue(of({
        idPaciente: 3,
        frecuenciaMin: 65,
        frecuenciaMax: 115
      }))
    };

    mockTelemetryService = {
      getLive: vi.fn().mockReturnValue(of({
        idPaciente: 3,
        pulsoPpm: 110,
        nivelRiesgo: 'CRITICO',
        fechaHora: new Date().toISOString(),
        esperandoLecturas: false
      }))
    };

    mockReportService = {
      downloadPdfReport: vi.fn().mockReturnValue(of(new Blob(['pdf content'], { type: 'application/pdf' }))),
      saveBlobToFile: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [PatientDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { params: of({ id: '3' }) }
        },
        { provide: PatientService, useValue: mockPatientService },
        { provide: TelemetryService, useValue: mockTelemetryService },
        { provide: ReportService, useValue: mockReportService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and default to "monitoreo" tab (patient-monitoring.png)', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab).toBe('monitoreo');
    expect(component.isHighRisk).toBe(true);
  });

  it('should switch tabs correctly to "historial" and "ajustes"', () => {
    component.activeTab = 'historial';
    expect(component.activeTab).toBe('historial');

    component.activeTab = 'ajustes';
    expect(component.activeTab).toBe('ajustes');
  });

  it('should flag threshold as invalid when Max <= Min (threshold-error.png)', () => {
    component.activeTab = 'ajustes';
    component.tempFrecuenciaMax = 50;
    component.tempFrecuenciaMin = 100;
    component.validateThresholds();

    expect(component.isThresholdInvalid).toBe(true);
  });

  it('should accept valid threshold when Max > Min', () => {
    component.activeTab = 'ajustes';
    component.tempFrecuenciaMax = 100;
    component.tempFrecuenciaMin = 60;
    component.validateThresholds();

    expect(component.isThresholdInvalid).toBe(false);
  });

  it('should save clinical note and store it in list', () => {
    component.newNoteText = 'Paciente en observación continua por picos matutinos';
    component.saveNote();

    expect(component.clinicalNotes.length).toBeGreaterThan(0);
    expect(component.clinicalNotes[0].texto).toContain('Paciente en observación continua');
    expect(component.newNoteText).toBe('');
  });

  it('should toggle and clear date filter in historial tab (history-range.png)', () => {
    component.activeTab = 'historial';
    component.selectDay(10);
    component.applyCalendarRange();

    expect(component.isDateFilterActive).toBe(true);
    expect(component.activeDateRangeLabel).toBe('10 Oct - 15 Oct');

    component.clearDateFilter();
    expect(component.isDateFilterActive).toBe(false);
  });

  it('should trigger empty range state when selecting dates with no data (historic-sin datos.png)', () => {
    component.activeTab = 'historial';
    component.selectEmptyRange();
    component.applyCalendarRange();

    expect(component.isDateFilterActive).toBe(true);
    expect(component.hasHistoryData).toBe(false);
  });

  it('should switch simulation modes between NORMAL, CRITICO and AUTO', () => {
    component.setSimulationMode('NORMAL');
    expect(component.simulationMode).toBe('NORMAL');
    expect(component.currentPulse).toBe(72);
    expect(component.isHighRisk).toBe(false);

    component.setSimulationMode('CRITICO');
    expect(component.simulationMode).toBe('CRITICO');
    expect(component.currentPulse).toBe(138);
    expect(component.isHighRisk).toBe(true);

    component.setSimulationMode('AUTO');
    expect(component.simulationMode).toBe('AUTO');
  });

  it('should toggle device connection state', () => {
    component.isOnline = false;
    component.toggleDeviceConnection();
    expect(component.isOnline).toBe(true);
    expect(component.currentPulse).toBeGreaterThan(0);

    component.toggleDeviceConnection();
    expect(component.isOnline).toBe(false);
  });
});
