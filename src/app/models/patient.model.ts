export type RiskLevel = 'NORMAL' | 'MODERADO' | 'CRITICO';

export interface Patient {
  idPaciente: number;
  idUsuario?: number;
  correo?: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string;
  edad?: number;
  genero: string;
  pesoKg?: number;
  tallaCm?: number;
  imc?: number;
  obesidad?: boolean;
  tabaquismo?: boolean;
  consumoAlcohol?: boolean;
  diabetes?: boolean;
  antecedentesCv?: boolean;
  usoMedicacion?: boolean;
  hipertension?: boolean;
  tiroides?: boolean;
  acv?: boolean;
  frecuenciaMin: number;
  frecuenciaMax: number;
  presionSisMax?: number;
  presionDiaMax?: number;
}

export interface PatientCreateRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string;
  edad?: number;
  genero?: string;
  correo: string;
  celular?: string;
  password?: string;
  pesoKg?: number;
  tallaCm?: number;
  obesidad?: boolean;
  tabaquismo?: boolean;
  consumoAlcohol?: boolean;
  antecedentesCv?: boolean;
  usoMedicacion?: boolean;
  diabetes?: boolean;
  hipertension?: boolean;
  acv?: boolean;
  tiroides?: boolean;
  frecuenciaMin?: number;
  frecuenciaMax?: number;
  presionSisMax?: number;
  presionDiaMax?: number;
}

export interface ThresholdUpdateRequest {
  frecuenciaMin: number;
  frecuenciaMax: number;
  presionSisMax?: number;
  presionDiaMax?: number;
}

export interface PatientTriage {
  idPaciente: number;
  dni: string;
  nombres: string;
  apellidos: string;
  genero: string;
  edad: number;
  ultimoPulso?: number;
  ultimaPresionSistolica?: number;
  ultimaPresionDiastolica?: number;
  nivelRiesgoActual: RiskLevel;
  scoreRiesgo?: number;
  ultimaMedicionFechaHora?: string;
  enlaceActivo: boolean;
  estadoEnlaceTexto: string;
  totalAlertasPendientes: number;
  frecuenciaMin?: number;
  frecuenciaMax?: number;
}
