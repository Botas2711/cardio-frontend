import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let mockAuthService: any;
  let router: Router;

  beforeEach(async () => {
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

    mockAuthService = {
      solicitarRecuperacionClave: vi.fn(),
      restablecerClave: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render recovery header and email field (password-recovery.png)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Recuperar Contraseña');
    expect(compiled.textContent).toContain('Te enviaremos un enlace para restablecer tu cuenta');
    expect(compiled.textContent).toContain('Correo electrónico');
    expect(compiled.textContent).toContain('Enviar enlace');
    expect(compiled.textContent).toContain('Volver al inicio de sesión');
  });

  it('should call authService.solicitarRecuperacionClave on valid submit and show success state', () => {
    mockAuthService.solicitarRecuperacionClave.mockReturnValue(of({
      exitoso: true,
      mensaje: 'Enlace enviado con éxito'
    }));

    component.requestForm.setValue({ correo: 'admin@gmail.com' });
    component.onRequestToken();

    expect(mockAuthService.solicitarRecuperacionClave).toHaveBeenCalledWith({ correo: 'admin@gmail.com' });
    expect(component.emailSent).toBe(true);
    expect(component.sentEmail).toBe('admin@gmail.com');

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('¡Correo Enviado!');
    expect(compiled.textContent).toContain('Iniciar Sesión');
  });
});
