import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserRole } from '../../../models/user.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn(),
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form as invalid when empty', () => {
    expect(component.loginForm.valid).toBe(false);
  });

  it('should toggle password visibility correctly', () => {
    expect(component.showPassword).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(true);
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(false);
  });

  it('should populate form when fillDemoCredentials is called', () => {
    component.fillDemoCredentials();
    expect(component.loginForm.value.correo).toBe('agustinalex14@gmail.com');
    expect(component.loginForm.value.password).toBe('Botas2311@');
    expect(component.loginForm.valid).toBe(true);
  });

  it('should display inline error and highlight border on login failure (HU001 - login-error.png)', () => {
    mockAuthService.login.mockReturnValue(throwError(() => ({
      error: { message: 'Credenciales inválidas' }
    })));

    component.loginForm.setValue({
      correo: 'admin@gmail.com',
      password: 'incorrectpassword'
    });

    component.onSubmit();

    expect(component.hasLoginError).toBe(true);
    expect(component.loginErrorMessage).toBe('Credenciales incorrectas');

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Credenciales incorrectas');
  });

  it('should navigate to /triage on successful login with CARDIOLOGO role', () => {
    mockAuthService.login.mockReturnValue(of({
      token: 'mock-jwt-token',
      tipoToken: 'Bearer',
      idUsuario: 1,
      correo: 'agustinalex14@gmail.com',
      rol: 'CARDIOLOGO',
      nombres: 'Médico',
      apellidos: 'Cardiólogo'
    }));

    component.loginForm.setValue({
      correo: 'agustinalex14@gmail.com',
      password: 'Botas2311@'
    });

    component.onSubmit();

    expect(component.hasLoginError).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/triage']);
  });

  it('should clear login error when user types into form controls', () => {
    component.hasLoginError = true;
    component.clearLoginError();
    expect(component.hasLoginError).toBe(false);
  });
});
