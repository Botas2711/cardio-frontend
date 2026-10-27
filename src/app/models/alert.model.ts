import { RiskLevel } from './patient.model';

export type AlertType =
  | 'CRISIS_HIPERTENSIVA'
  | 'ARRITMIA_SEVERA'
  | 'TAQUICARDIA'
  | 'TAQUICARDIA_CRITICA'
  | 'BRADICARDIA'
  | 'BRADICARDIA_SEVERA'
  | 'RIESGO_CARDIOVASCULAR_ALTO'
  | 'DESVIACION_UMBRAL'
  | string;

export interface Alert {
  idAlerta: number;
  idPaciente: number;
  nombrePaciente: string;
  dniPaciente: string;
  fechaHora: string;
  tipoAlerta: AlertType;
  valorRegistrado: string;
  explicacionShap?: string;
  notificacionEnviada: boolean;
  atendida: boolean;
  observacionMedica?: string;
}

export interface AlertCount {
  totalNoAtendidas: number;
}

export interface AlertAttendRequest {
  observacionMedica: string;
}

export interface ShapFactor {
  factor: string;
  valorRegistrado: string;
  limiteSeguro: string;
  pesoShap: number;
  impacto: string;
  descripcion: string;
}

export interface AlertExplanation {
  idAlerta: number;
  idPaciente: number;
  nombrePaciente: string;
  nivelRiesgo: RiskLevel;
  scoreRiesgo: number;
  estadoEvaluacion: string;
  mensajeClinico: string;
  factores: ShapFactor[];
}
