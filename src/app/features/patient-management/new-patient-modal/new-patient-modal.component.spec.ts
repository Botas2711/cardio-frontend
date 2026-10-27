import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NewPatientModalComponent } from './new-patient-modal.component';
import { PatientService } from '../../../services/patient.service';
import { of, throwError } from 'rxjs';

describe('NewPatientModalComponent', () => {
  let component: NewPatientModalComponent;
  let fixture: ComponentFixture<NewPatientModalComponent>;
  let mockPatientService: any;

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
      verificarDni: vi.fn().mockReturnValue(of({ existe: false })),
      create: vi.fn().mockReturnValue(of({ idPaciente: 10 }))
    };

    await TestBed.configureTestingModule({
      imports: [NewPatientModalComponent],
      providers: [
        { provide: PatientService, useValue: mockPatientService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NewPatientModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and start on Step 1 (new-patient-modal-1.png)', () => {
    expect(component).toBeTruthy();
    expect(component.currentStep).toBe(1);
  });

  it('should detect duplicate DNI and flag isDniDuplicate (dni-error-modal.png)', () => {
    mockPatientService.verificarDni.mockReturnValue(of({ existe: true }));
    component.dni = '74289123';
    component.checkDniUniqueness();

    expect(component.isDniDuplicate).toBe(true);
  });

  it('should prevent navigating to Step 2 if Step 1 is invalid or DNI duplicate', () => {
    component.nombres = 'Piero';
    component.apellidos = 'Aguirre';
    component.dni = '74289123';
    component.isDniDuplicate = true;

    component.goToStep2();
    expect(component.currentStep).toBe(1);
  });

  it('should advance to Step 2 when Step 1 is fully valid (new-patient-modal-2.png)', () => {
    component.nombres = 'Piero';
    component.apellidos = 'Aguirre Ellen';
    component.dni = '87654321';
    component.celular = '987654321';
    component.isDniDuplicate = false;

    component.goToStep2();
    expect(component.currentStep).toBe(2);
  });

  it('should call patientService.create on submitPatient with complete clinical payload', () => {
    component.currentStep = 2;
    component.nombres = 'Piero';
    component.apellidos = 'Aguirre Ellen';
    component.dni = '87654321';
    component.celular = '987654321';
    component.edad = 38;
    component.pesoKg = 82;
    component.tallaCm = 174;
    component.obesidad = true;
    component.diabetes = true;

    component.submitPatient();

    expect(mockPatientService.create).toHaveBeenCalledWith(expect.objectContaining({
      dni: '87654321',
      nombres: 'Piero',
      apellidos: 'Aguirre Ellen',
      edad: 38,
      pesoKg: 82,
      tallaCm: 174,
      obesidad: true,
      diabetes: true
    }));
  });
});
