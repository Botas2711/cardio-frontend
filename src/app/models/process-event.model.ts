export interface ProcessNode {
  actividad: string;
  cantidadPacientes: number;
  totalOcurrencias: number;
}

export interface ProcessEdge {
  origen: string;
  destino: string;
  cantidadCasos: number;
}

export interface ProcessMap {
  totalCasos: number;
  actividades: ProcessNode[];
  transiciones: ProcessEdge[];
  mensaje: string;
}

export interface StepWaitTime {
  etapaOrigen: string;
  etapaDestino: string;
  duracionPromedioMinutos: number;
  duracionLimiteNormalMinutos: number;
  demorado: boolean;
  colorAlerta: string;
  mensajeEstado: string;
}

export interface ProcessTimes {
  pasos: StepWaitTime[];
  estadoGeneral: string;
  mensaje: string;
}

export interface DeviationCase {
  idPaciente: number;
  nombrePaciente: string;
  dniPaciente: string;
  motivoDesvio: string;
}

export interface ConformityReport {
  porcentajeCumplimiento: number;
  totalCasos: number;
  casosConformes: number;
  casosConDesvios: number;
  mensaje: string;
  casosIncompletos: DeviationCase[];
}

export interface TelemetryNode {
  paso: number;
  idActividad: string;
  titulo: string;
  subtitulo: string;
}

export interface TelemetryTransition {
  origen: string;
  destino: string;
  duracionMs: number;
  tiempoTexto: string;
  etiqueta: string;
  estadoConformidad: 'CONFORME' | 'DESVIACION' | 'DESVIO';
  color: string;
  esCritico: boolean;
}

export interface TelemetryFlow {
  titulo: string;
  subtitulo: string;
  filtroRiesgoAlto: boolean;
  kpi1Titulo: string;
  kpi1Valor: string;
  kpi2Titulo: string;
  kpi2Valor: string;
  kpi2Color: string;
  nodos: TelemetryNode[];
  transiciones: TelemetryTransition[];
}

export interface EventoProcesoItem {
  idEvento: number;
  idPaciente: number;
  nombrePaciente: string;
  dniPaciente: string;
  actividad: string;
  fechaInicio: string;
  fechaFin?: string;
  ejecutor?: string;
  estadoConformidad: 'CONFORME' | 'DESVIACION' | 'DESVIO';
}

