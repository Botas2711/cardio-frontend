export type UserRole = 'CARDIOLOGO' | 'PACIENTE';

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tipoToken: string;
  idUsuario: number;
  correo: string;
  rol: UserRole;
  idPaciente?: number;
  nombres?: string;
  apellidos?: string;
  dni?: string;
}

export interface ForgotPasswordRequest {
  correo: string;
}

export interface ResetPasswordRequest {
  token: string;
  nuevaPassword: string;
}

export interface MessageResponse {
  mensaje: string;
  exitoso: boolean;
}
