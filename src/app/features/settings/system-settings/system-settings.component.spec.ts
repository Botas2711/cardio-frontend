import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SystemSettingsComponent } from './system-settings.component';
import { SettingsService, SETTINGS_STORAGE_KEY } from '../../../core/services/settings.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('SystemSettingsComponent', () => {
  let component: SystemSettingsComponent;
  let fixture: ComponentFixture<SystemSettingsComponent>;
  let settingsService: SettingsService;

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
    localStorage.removeItem(SETTINGS_STORAGE_KEY);

    await TestBed.configureTestingModule({
      imports: [SystemSettingsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SettingsService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SystemSettingsComponent);
    component = fixture.componentInstance;
    settingsService = TestBed.inject(SettingsService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  });

  it('debe crearse correctamente el componente de configuración del sistema', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar los valores por defecto del doctor Pablo Rojas', () => {
    expect(component.nombres).toBe('Pablo');
    expect(component.apellidos).toBe('Rojas');
    expect(component.dni).toBe('91705963');
    expect(component.correo).toBe('pablorojas01@gmail.com');
    expect(component.sonidoAlerta).toBe(true);
    expect(component.frecuenciaMinDefecto).toBe(60);
    expect(component.frecuenciaMaxDefecto).toBe(100);
  });

  it('debe conmutar el switch de sonido de alertas', () => {
    expect(component.sonidoAlerta).toBe(true);
    component.toggleSonidoAlerta();
    expect(component.sonidoAlerta).toBe(false);
    component.toggleSonidoAlerta();
    expect(component.sonidoAlerta).toBe(true);
  });

  it('debe detectar rango de umbrales inválido cuando el máximo es menor o igual al mínimo', () => {
    component.frecuenciaMinDefecto = 100;
    component.frecuenciaMaxDefecto = 80;
    component.validateThresholds();
    expect(component.isThresholdInvalid).toBe(true);

    component.frecuenciaMaxDefecto = 110;
    component.validateThresholds();
    expect(component.isThresholdInvalid).toBe(false);
  });

  it('debe guardar la configuración en SettingsService y persistirla', () => {
    component.nombres = 'Pablo Andrés';
    component.apellidos = 'Rojas Quispe';
    component.frecuenciaMinDefecto = 55;
    component.frecuenciaMaxDefecto = 105;
    component.saveChanges();

    const saved = settingsService.getSettings();
    expect(saved.nombres).toBe('Pablo Andrés');
    expect(saved.apellidos).toBe('Rojas Quispe');
    expect(saved.frecuenciaMinDefecto).toBe(55);
    expect(saved.frecuenciaMaxDefecto).toBe(105);
  });
});
