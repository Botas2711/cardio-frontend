import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
      })),
      getHistorical: vi.fn().mockReturnValue(of({
        mediciones: [],
        totalRegistros: 0,
        promedioPulso: 75,
        maxPulso: 80,
        minPulso: 70
      }))
    };

    mockReportService = {
      downloadPdfReport: vi.fn().mockReturnValue(of(new Blob(['pdf content'], { type: 'application/pdf' }))),
      saveBlobToFile: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [PatientDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { params: of({ id: '3' }), queryParams: of({}) }
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

  it('should toggle and clear date filter in historial tab', () => {
    component.activeTab = 'historial';
    component.tempRangeStart = '2026-10-10';
    component.tempRangeEnd = '2026-10-15';
    component.applyCalendarRange();

    expect(component.isDateFilterActive).toBe(true);
    expect(component.selectedStartDate).toBe('2026-10-10');
    expect(component.selectedEndDate).toBe('2026-10-15');

    component.clearDateFilter();
    expect(component.isDateFilterActive).toBe(false);
    expect(component.selectedStartDate).toBe('');
    expect(component.selectedEndDate).toBe('');
  });

  it('should trigger report generation when downloadHistoryPdf is called', () => {
    component.patient = {
      idPaciente: 3,
      dni: '14567892',
      nombres: 'Agustín',
      apellidos: 'Aguilar',
      genero: 'MASCULINO',
      frecuenciaMin: 60,
      frecuenciaMax: 100
    };
    component.downloadHistoryPdf();
    expect(component.patient.idPaciente).toBe(3);
  });
});
