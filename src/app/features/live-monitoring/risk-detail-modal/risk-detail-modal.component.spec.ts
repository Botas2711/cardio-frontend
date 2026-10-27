import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RiskDetailModalComponent } from './risk-detail-modal.component';
import { ReportService } from '../../../services/report.service';
import { of } from 'rxjs';

describe('RiskDetailModalComponent', () => {
  let component: RiskDetailModalComponent;
  let fixture: ComponentFixture<RiskDetailModalComponent>;
  let mockReportService: any;

  beforeEach(async () => {
    mockReportService = {
      downloadPdfReport: vi.fn().mockReturnValue(of(new Blob(['pdf content'], { type: 'application/pdf' }))),
      saveBlobToFile: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RiskDetailModalComponent],
      providers: [
        { provide: ReportService, useValue: mockReportService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RiskDetailModalComponent);
    component = fixture.componentInstance;
  });

  it('should calculate dynamic risk score and classify as Riesgo Alto for Agustin Aguilar mockup (risk-detail-modal.png)', () => {
    component.patient = {
      idPaciente: 3,
      dni: '14567892',
      nombres: 'Agustín',
      apellidos: 'Aguilar',
      genero: 'MASCULINO',
      imc: 31,
      diabetes: true,
      tabaquismo: false,
      hipertension: false,
      frecuenciaMin: 60,
      frecuenciaMax: 100
    };
    component.patientName = 'Agustín Aguilar';
    component.currentPulse = 110;

    fixture.detectChanges();

    expect(component.currentBpm).toBe(110);
    expect(component.patientImc).toBe(31);
    expect(component.riskScore).toBe(82);
    expect(component.riskClassification.label).toBe('Riesgo Alto');
  });

  it('should adapt score and classify as Riesgo Bajo for normal sinus patient', () => {
    component.patient = {
      idPaciente: 2,
      dni: '32114890',
      nombres: 'Carlos',
      apellidos: 'Mendoza',
      genero: 'MASCULINO',
      imc: 23.5,
      diabetes: false,
      tabaquismo: false,
      hipertension: false,
      frecuenciaMin: 60,
      frecuenciaMax: 100
    };
    component.patientName = 'Carlos Mendoza';
    component.currentPulse = 72;

    fixture.detectChanges();

    expect(component.currentBpm).toBe(72);
    expect(component.patientImc).toBe(23.5);
    expect(component.riskScore).toBeLessThan(45);
    expect(component.riskClassification.label).toBe('Riesgo Bajo');
  });

  it('should build dynamic comparison rows based on individual patient diseases', () => {
    component.patient = {
      idPaciente: 3,
      dni: '14567892',
      nombres: 'Agustín',
      apellidos: 'Aguilar',
      genero: 'MASCULINO',
      imc: 31,
      diabetes: true,
      tabaquismo: true,
      hipertension: false,
      frecuenciaMin: 60,
      frecuenciaMax: 100
    };
    component.currentPulse = 110;

    fixture.detectChanges();

    const rows = component.comparisonRows;
    expect(rows.length).toBe(4); // Frecuencia, IMC, Diabetes, Tabaquismo
    expect(rows.some(r => r.parametro === 'Diabetes')).toBe(true);
    expect(rows.some(r => r.parametro === 'Tabaquismo')).toBe(true);
    expect(rows.some(r => r.parametro === 'Hipertensión')).toBe(false);
  });

  it('should emit closeModal when close() is called', () => {
    const spy = vi.spyOn(component.closeModal, 'emit');
    component.close();
    expect(spy).toHaveBeenCalled();
  });
});
