import { RiskLevel } from './patient.model';

export interface GraphPoint {
  fechaHora: string;
  pulsoPpm: number;
  presionSistolica?: number;
  presionDiastolica?: number;
  nivelRiesgo: RiskLevel;
}

export interface TelemetryLive {
  idPaciente: number;
  pulsoPpm?: number;
  presionSistolica?: number;
  presionDiastolica?: number;
  nivelRiesgo?: RiskLevel;
  estadoMensaje: string;
  esperandoLecturas: boolean;
  sensorConectado?: boolean;
  fechaHora?: string;
  scoreRiesgo?: number;
  explicacionShap?: string;
  dispositivoNombre?: string;
  bateriaPorcentaje?: number;
}

export interface Summary24h {
  puntos: GraphPoint[];
  suficientesDatos: boolean;
  mensaje: string;
  promedioPulso: number;
  maxPulso: number;
  minPulso: number;
}

export interface HistoricalSummary {
  agrupacion: string;
  totalRegistros: number;
  promedioPulso: number;
  maxPulso: number;
  minPulso: number;
  promedioPresionSistolica: number;
  maxPresionSistolica: number;
  minPresionSistolica: number;
  promedioPresionDiastolica: number;
  maxPresionDiastolica: number;
  minPresionDiastolica: number;
  mensaje: string;
  mediciones: GraphPoint[];
}

export interface HourlyBlockSummary {
  bloque: string;
  intervalo: string;
  totalRegistros: number;
  promedioPulso: number;
  promedioPresionSistolica: number;
  promedioPresionDiastolica: number;
  mensaje: string;
  lecturas: GraphPoint[];
}
