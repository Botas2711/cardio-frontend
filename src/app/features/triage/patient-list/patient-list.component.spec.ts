import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PatientListComponent } from './patient-list.component';
import { PatientService } from '../../../services/patient.service';
import { SearchStateService } from '../../../core/services/search-state.service';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { PatientTriage } from '../../../models/patient.model';

describe('PatientListComponent', () => {
  let component: PatientListComponent;
  let fixture: ComponentFixture<PatientListComponent>;
  let mockPatientService: any;
  let searchStateService: SearchStateService;
  let router: Router;

  const mockPatients: PatientTriage[] = [
    {
      idPaciente: 1,
      dni: '48921345',
      nombres: 'Sofía',
      apellidos: 'Rodríguez Peña',
      genero: 'FEMENINO',
      edad: 34,
      ultimoPulso: 138,
      nivelRiesgoActual: 'CRITICO',
      scoreRiesgo: 0.94,
      enlaceActivo: true,
      estadoEnlaceTexto: 'Transmisión activa',
      totalAlertasPendientes: 1
    },
    {
      idPaciente: 2,
      dni: '32114890',
      nombres: 'Carlos',
      apellidos: 'Mendoza Herrera',
      genero: 'MASCULINO',
      edad: 42,
      ultimoPulso: 72,
      nivelRiesgoActual: 'NORMAL',
      scoreRiesgo: 0.1,
      enlaceActivo: true,
      estadoEnlaceTexto: 'Transmisión activa',
      totalAlertasPendientes: 0
    },
    {
      idPaciente: 3,
      dni: '14567892',
      nombres: 'Agustín',
      apellidos: 'Aguilar',
      genero: 'MASCULINO',
      edad: 58,
      ultimoPulso: 110,
      nivelRiesgoActual: 'CRITICO',
      scoreRiesgo: 0.82,
      enlaceActivo: true,
      estadoEnlaceTexto: 'Transmisión activa',
      totalAlertasPendientes: 1
    },
    {
      idPaciente: 4,
      dni: '29876123',
      nombres: 'Alejandro',
      apellidos: 'Ruiz Diaz',
      genero: 'MASCULINO',
      edad: 46,
      ultimoPulso: undefined,
      nivelRiesgoActual: 'NORMAL',
      scoreRiesgo: 0,
      enlaceActivo: false,
      estadoEnlaceTexto: 'Dispositivo fuera de línea',
      totalAlertasPendientes: 0
    },
    {
      idPaciente: 5,
      dni: '41345678',
      nombres: 'Lucía',
      apellidos: 'Fernández Ortiz',
      genero: 'FEMENINO',
      edad: 39,
      ultimoPulso: 68,
      nivelRiesgoActual: 'NORMAL',
      scoreRiesgo: 0.08,
      enlaceActivo: true,
      estadoEnlaceTexto: 'Transmisión activa',
      totalAlertasPendientes: 0
    }
  ];

  beforeEach(async () => {
    mockPatientService = {
      getTriage: vi.fn().mockReturnValue(of(mockPatients)),
      verificarDni: vi.fn().mockReturnValue(of({ existe: false }))
    };

    await TestBed.configureTestingModule({
      imports: [PatientListComponent],
      providers: [
        provideRouter([]),
        { provide: PatientService, useValue: mockPatientService }
      ]
    }).compileComponents();

    searchStateService = TestBed.inject(SearchStateService);
    searchStateService.clearQuery();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(PatientListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load patients and compute correct metric cards (dashboard.png: 5 total, 2 low, 2 high with active link)', () => {
    expect(component.patients.length).toBe(5);
    expect(component.lowRiskCount).toBe(2);
    expect(component.highRiskCount).toBe(2);
  });

  it('should filter patients by name or DNI in real-time', () => {
    searchStateService.setQuery('Mendoza');
    fixture.detectChanges();
    expect(component.filteredPatients.length).toBe(1);
    expect(component.filteredPatients[0].apellidos).toBe('Mendoza Herrera');

    searchStateService.setQuery('14567892');
    fixture.detectChanges();
    expect(component.filteredPatients.length).toBe(1);
    expect(component.filteredPatients[0].nombres).toBe('Agustín');
  });

  it('should render empty state when search finds no match (empty-search.png)', () => {
    searchStateService.setQuery('PacienteInexistente123');
    fixture.detectChanges();

    expect(component.filteredPatients.length).toBe(0);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se encontraron resultados');
    expect(compiled.textContent).toContain('Limpiar búsqueda');
  });

  it('should reset search query when clearSearch is called', () => {
    searchStateService.setQuery('Inexistente');
    expect(component.filteredPatients.length).toBe(0);

    component.clearSearch();
    expect(searchStateService.searchQuery()).toBe('');
    expect(component.filteredPatients.length).toBe(5);
  });

  it('should navigate to patient detail on viewPatient', () => {
    component.viewPatient(3);
    expect(router.navigate).toHaveBeenCalledWith(['/live-monitoring', 3]);
  });
});
