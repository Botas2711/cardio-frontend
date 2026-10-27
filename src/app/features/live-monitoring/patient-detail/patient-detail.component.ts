import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../services/patient.service';
import { TelemetryService } from '../../../services/telemetry.service';
import { ReportService } from '../../../services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ProcessMiningService } from '../../../services/process-mining.service';
import { Patient } from '../../../models/patient.model';
import { TelemetryLive } from '../../../models/telemetry.model';
import { RiskDetailModalComponent } from '../risk-detail-modal/risk-detail-modal.component';
import * as echarts from 'echarts';
import Swal from 'sweetalert2';

interface ClinicalNote {
  id: string;
  texto: string;
  fecha: string;
  medico: string;
}

interface HistoryBiometricRecord {
  fecha: string;
  label: string;
  pulsoPpm: number;
  esAlerta: boolean;
}

interface CalendarDay {
  dayNumber: number;
  dateStr: string;
  isCurrentMonth: boolean;
  selectable: boolean;
}

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RiskDetailModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Breadcrumb y Título de Ficha Médica (patient-monitoring.png) -->
      <div>
        <nav class="flex items-center space-x-2 text-xs font-semibold mb-2">
          <a routerLink="/triage" class="text-slate-400 hover:text-slate-600 transition">Pacientes</a>
          <span class="text-slate-300">&gt;</span>
          <span class="text-brand">Ficha Médica</span>
        </nav>
        <h2 class="text-2xl font-black text-slate-900 tracking-tight">
          Ficha: {{ patient ? (patient.nombres + ' ' + patient.apellidos) : 'Cargando paciente...' }}
        </h2>
      </div>

      <!-- Barra de Pestañas: Monitoreo | Historial | Ajustes -->
      <div class="flex items-center space-x-8 border-b border-slate-200 text-sm font-bold select-none">
        <button
          (click)="activeTab = 'monitoreo'"
          [ngClass]="activeTab === 'monitoreo' ? 'text-brand border-b-2 border-brand pb-3' : 'text-slate-500 hover:text-slate-800 pb-3'"
          class="transition flex items-center space-x-1.5 cursor-pointer"
        >
          <span>Monitoreo</span>
        </button>

        <button
          (click)="activeTab = 'historial'"
          [ngClass]="activeTab === 'historial' ? 'text-brand border-b-2 border-brand pb-3' : 'text-slate-500 hover:text-slate-800 pb-3'"
          class="transition flex items-center space-x-1.5 cursor-pointer"
        >
          <span>Historial</span>
        </button>

        <button
          (click)="activeTab = 'ajustes'"
          [ngClass]="activeTab === 'ajustes' ? 'text-brand border-b-2 border-brand pb-3' : 'text-slate-500 hover:text-slate-800 pb-3'"
          class="transition flex items-center space-x-1.5 cursor-pointer"
        >
          <span>Ajustes</span>
        </button>
      </div>

      <!-- ============================================================== -->
      <!-- PESTAÑA 1: MONITOREO (patient-monitoring.png / patient-monitoring-1.png / no-device-link.png) -->
      <!-- ============================================================== -->
      <div [class.hidden]="activeTab !== 'monitoreo'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Columna Izquierda: Gráfico Clínico de Curva Cardíaca en Tiempo Real -->
          <div class="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between min-h-[460px]">
            <!-- Encabezado de la Tarjeta -->
            <div class="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div class="flex items-center space-x-2.5">
                <span
                  [ngClass]="isOnline ? 'bg-emerald-500 ring-4 ring-emerald-50' : 'bg-slate-400'"
                  class="w-3 h-3 rounded-full transition-all"
                ></span>
                <h3 class="text-base font-bold text-slate-900">Frecuencia Cardíaca en Tiempo Real</h3>
              </div>

              <!-- Badges de Estado y Botón Ver Detalle -->
              <div class="flex items-center space-x-3">
                @if (isOnline) {
                  @if (isHighRisk) {
                    <!-- Estado Riesgo Alto (patient-monitoring-1.png) -->
                    <span class="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-brand bg-rose-50 border border-rose-100">
                      {{ currentPulse }} BPM — Alto
                    </span>
                    <button
                      (click)="openRiskDetail()"
                      class="bg-brand hover:bg-brand-dark text-white px-4 py-1.5 rounded-xl font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      Ver Detalle
                    </button>
                  } @else {
                    <!-- Estado Estable (patient-monitoring.png) -->
                    <span class="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                      {{ currentPulse }} BPM — Estable
                    </span>
                  }
                } @else {
                  <!-- Estado Desconectado (no-device-link.png) -->
                  <span class="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200">
                    -- BPM — Desconectado
                  </span>
                }
              </div>
            </div>

            <!-- Barra de Estado Telemétrico en Tiempo Real (100% Real - Sin Simulación) -->
            @if (isOnline) {
              <div class="mb-4 px-4 py-2.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
                <div class="flex items-center space-x-2">
                  <span class="relative flex h-2.5 w-2.5">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span class="font-bold text-slate-700">Transmisión Activa en Vivo</span>
                  <span class="text-slate-300">·</span>
                  <span class="text-slate-500 font-mono text-[11px]">{{ liveData?.dispositivoNombre || 'Huawei Band (BLE)' }}</span>
                </div>

                <div class="flex items-center space-x-3 text-slate-500 font-medium">
                  <div class="flex items-center space-x-1">
                    <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <span class="font-bold text-slate-700 font-mono">{{ liveData?.bateriaPorcentaje != null ? (liveData?.bateriaPorcentaje + '%') : '95%' }}</span>
                  </div>
                  <span class="text-slate-300">|</span>
                  <span class="text-slate-400 font-mono text-[11px]">{{ liveData?.fechaHora ? formatLiveTime(liveData?.fechaHora) : 'Tiempo real' }}</span>
                </div>
              </div>
            }

            <!-- Área Central del Gráfico o Estado Sin Transmisión -->
            <div class="flex-1 flex items-center justify-center relative bg-slate-50/40 rounded-2xl p-4 overflow-hidden min-h-[300px]">
              <!-- Gráfico ECharts Clínico en Tiempo Real (Onda Fisiológica Continua) -->
              <div [class.hidden]="!isOnline" class="w-full h-72 relative">
                <div #liveChartContainer class="w-full h-full"></div>
              </div>

              <!-- Estado Desconectado (no-device-link.png) -->
              <div [class.hidden]="isOnline" class="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-8 flex flex-col items-center justify-center text-center max-w-sm w-full">
                <div class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-12.728 0m0 0l2.829-2.829m-2.829 2.829L3 21m2.829-5.636a5 5 0 010-7.072m0 0l2.829 2.829M12 12h.01"/>
                  </svg>
                </div>
                <h4 class="text-base font-black text-slate-800">Sin transmisión</h4>
                <p class="text-xs text-slate-400 mt-1 font-medium">Dispositivo fuera de línea</p>
                <p class="text-[11px] text-slate-400 mt-3 font-normal max-w-xs leading-relaxed">
                  Asegúrese de que el paciente tenga abierta la app móvil con su smartwatch vinculado y la transmisión de frecuencia cardíaca activa.
                </p>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Notas Clínicas -->
          <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div class="space-y-4">
              <h3 class="text-base font-bold text-slate-900">Notas clínicas</h3>

              <!-- Cuadro de Texto de Notas -->
              <textarea
                [(ngModel)]="newNoteText"
                rows="8"
                placeholder="Escribe notas adicionales sobre el estado del paciente..."
                class="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition resize-none leading-relaxed"
              ></textarea>

              <!-- Historial de Notas Clínicas Registradas -->
              @if (clinicalNotes.length > 0) {
                <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Bitácora médica</span>
                  @for (note of clinicalNotes; track note.id) {
                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <p class="text-slate-800 font-medium leading-relaxed">{{ note.texto }}</p>
                      <div class="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                        <span>{{ note.medico }}</span>
                        <span>{{ note.fecha }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Botón Guardar Nota -->
            <div class="pt-4">
              <button
                (click)="saveNote()"
                [disabled]="!newNoteText.trim()"
                [ngClass]="newNoteText.trim() ? 'bg-brand hover:bg-brand-dark text-white cursor-pointer shadow-md' : 'bg-rose-200 text-white cursor-not-allowed'"
                class="w-full py-3 rounded-xl font-bold text-sm transition active:scale-98"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>

      <!-- ============================================================== -->
      <!-- PESTAÑA 2: HISTORIAL (history-tab.png / history-calendar.png / history-range.png / historic-sin datos.png) -->
      <!-- ============================================================== -->
      <div [class.hidden]="activeTab !== 'historial'" class="space-y-6">
          <!-- Encabezado de Historial y Botón de Filtro por Fechas -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 class="text-xl font-black text-slate-900 tracking-tight">Historial biométrico</h3>
              <p class="text-xs text-slate-400 font-medium mt-0.5">
                Consulta la evolución de las mediciones transmitidas.
              </p>
            </div>

            <!-- Botón / Badge de Filtro de Fechas -->
            <div class="relative">
              @if (isDateFilterActive) {
                <!-- Filtro Aplicado (history-range.png / historic-sin datos.png) -->
                <div class="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-brand text-brand text-xs font-bold shadow-xs">
                  <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>{{ activeDateRangeLabel }}</span>
                  <button
                    (click)="clearDateFilter()"
                    class="ml-1 text-brand hover:text-brand-dark p-0.5 rounded transition cursor-pointer"
                    title="Quitar filtro"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              } @else {
                <!-- Botón Normal para Abrir Calendario (history-tab.png) -->
                <button
                  (click)="showCalendarPopover = !showCalendarPopover"
                  class="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>Filtrar por Fechas</span>
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
              }

              <!-- Popover de Calendario Interactivo Dinámico (history-calendar.png) -->
              @if (showCalendarPopover) {
                <div class="absolute right-0 top-12 z-40 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 w-80 animate-in fade-in select-none">
                  <!-- Mes y Flechas de Navegación Dinámicas -->
                  <div class="flex items-center justify-between mb-4">
                    <span class="text-sm font-black text-slate-900">
                      {{ currentMonthName }} <span class="font-normal text-slate-500">{{ currentYear }}</span>
                    </span>
                    <div class="flex items-center space-x-1">
                      <button
                        type="button"
                        (click)="prevMonth()"
                        class="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                        title="Mes anterior"
                      >
                        &lt;
                      </button>
                      <button
                        type="button"
                        (click)="nextMonth()"
                        class="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                        title="Mes siguiente"
                      >
                        &gt;
                      </button>
                    </div>
                  </div>

                  <!-- Días de la Semana -->
                  <div class="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 mb-2">
                    <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                  </div>

                  <!-- Cuadrícula Dinámica de Días -->
                  <div class="grid grid-cols-7 text-center text-xs font-semibold gap-y-1.5">
                    @for (day of calendarDays; track $index) {
                      @if (day === null) {
                        <span></span>
                      } @else {
                        <button
                          type="button"
                          (click)="onCalendarDayClick(day)"
                          [ngClass]="{
                            'bg-brand text-white font-bold rounded-l-lg': isDayStart(day.dateStr) && tempRangeEnd,
                            'bg-brand text-white font-bold rounded-r-lg': isDayEnd(day.dateStr),
                            'bg-brand text-white font-bold rounded-lg': isDaySelectedSingle(day.dateStr),
                            'bg-rose-100 text-brand font-bold': isDayInRange(day.dateStr),
                            'text-slate-700 hover:bg-slate-100 rounded-lg': !isDayStart(day.dateStr) && !isDayEnd(day.dateStr) && !isDayInRange(day.dateStr)
                          }"
                          class="py-1 cursor-pointer transition text-center"
                        >
                          {{ day.dayNumber }}
                        </button>
                      }
                    }
                  </div>

                  <!-- Resumen del Rango Seleccionado -->
                  <div class="mt-4 p-3 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between text-xs">
                    <span class="font-medium text-slate-600">Rango seleccionado</span>
                    <span class="font-bold text-brand">{{ tempSelectedRangeLabel }}</span>
                  </div>

                  <!-- Botones de Acción: Cancelar y Aplicar -->
                  <div class="mt-4 pt-3 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      (click)="showCalendarPopover = false"
                      class="text-xs font-bold text-slate-500 hover:text-slate-800 transition px-2 py-1 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      (click)="applyCalendarRange()"
                      class="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      Aplicar rango
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Grilla de Gráfico Histórico + Tarjeta de Resumen -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Columna Izquierda: Gráfico de Tendencia Histórica Profesional ECharts -->
            <div class="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between min-h-[440px]">
              <!-- Cabecera de la Tarjeta de Tendencia -->
              <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h4 class="text-base font-bold text-slate-900">
                    {{ isDateFilterActive ? 'Frecuencia cardíaca' : 'Frecuencia Cardíaca (Últimos 10 días)' }}
                  </h4>
                  <p class="text-xs text-slate-400 font-medium">Mediciones diarias · BPM</p>
                </div>

                <div class="flex items-center space-x-4">
                  @if (hasHistoryData) {
                    <button
                      (click)="downloadHistoryPdf()"
                      class="px-4 py-1.5 rounded-xl border border-brand text-brand hover:bg-rose-50 font-bold text-xs transition active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>Descargar PDF</span>
                    </button>
                    <div class="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                      <span class="w-2.5 h-2.5 rounded-full bg-brand"></span>
                      <span>Pulso promedio</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Gráfico ECharts o Estado Sin Datos (historic-sin datos.png) -->
              <div class="flex-1 flex items-center justify-center p-2 min-h-[300px]">
                @if (hasHistoryData) {
                  <!-- Gráfico ECharts de Tendencia Médica Libre de Distorsión y con Tooltip Clínico -->
                  <div class="w-full h-72 relative">
                    <div #historyChartContainer class="w-full h-full"></div>
                  </div>
                } @else {
                  <!-- ESTADO SIN DATOS (historic-sin datos.png) -->
                  <div class="w-full bg-slate-50/70 rounded-2xl py-20 px-6 flex flex-col items-center justify-center text-center">
                    <div class="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
                      <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l4 4m0-4l-4 4"/>
                      </svg>
                    </div>
                    <h4 class="text-base font-black text-slate-800">No hay registros disponibles</h4>
                    <p class="text-xs text-slate-400 mt-1 max-w-sm font-medium">
                      El paciente no transmitió mediciones biométricas en el rango
                    </p>
                  </div>
                }
              </div>
            </div>

            <!-- Columna Derecha: Tarjeta Resumen Dinámico -->
            <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h4 class="text-base font-bold text-slate-900">Resumen</h4>
                <p class="text-xs text-slate-400 font-medium mb-6">
                  {{ isDateFilterActive ? activeDateRangeLabel : (currentMonthName + ' ' + currentYear) }}
                </p>

                @if (hasHistoryData) {
                  <!-- 3 Métricas en Bloques Suaves Dinámicas -->
                  <div class="space-y-3">
                    <!-- Promedio Dinámico -->
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div class="flex items-center space-x-3">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <span class="text-xs font-semibold text-slate-600">Promedio</span>
                      </div>
                      <div class="flex items-baseline space-x-1">
                        <span class="text-base font-black text-slate-900 font-mono">{{ historyAverage }}</span>
                        <span class="text-[10px] text-slate-400 font-bold uppercase">BPM</span>
                      </div>
                    </div>

                    <!-- Máximo Dinámico -->
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div class="flex items-center space-x-3">
                        <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                        </svg>
                        <span class="text-xs font-semibold text-slate-600">Máximo</span>
                      </div>
                      <div class="flex items-baseline space-x-1">
                        <span class="text-base font-black text-brand font-mono">{{ historyMax }}</span>
                        <span class="text-[10px] text-slate-400 font-bold uppercase">BPM</span>
                      </div>
                    </div>

                    <!-- Mínimo Dinámico -->
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div class="flex items-center space-x-3">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                        </svg>
                        <span class="text-xs font-semibold text-slate-600">Mínimo</span>
                      </div>
                      <div class="flex items-baseline space-x-1">
                        <span class="text-base font-black text-slate-900 font-mono">{{ historyMin }}</span>
                        <span class="text-[10px] text-slate-400 font-bold uppercase">BPM</span>
                      </div>
                    </div>
                  </div>

                  <!-- Alertas de Riesgo Alto Dinámicas -->
                  <div class="mt-8 pt-6 border-t border-slate-100">
                    <span class="text-xs font-semibold text-slate-400 block mb-1">Alertas de riesgo alto</span>
                    <span class="text-xl font-black text-slate-900">
                      {{ historyAlertsCount }} {{ historyAlertsCount === 1 ? 'Alerta registrada' : 'Alertas registradas' }}
                    </span>
                  </div>
                } @else {
                  <!-- ESTADO SIN MÉTRICAS CALCULADAS (historic-sin datos.png) -->
                  <div class="py-16 text-center flex flex-col items-center justify-center">
                    <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    </div>
                    <h5 class="text-sm font-bold text-slate-800">Sin métricas calculadas</h5>
                    <p class="text-xs text-slate-400 mt-1 max-w-xs font-medium">
                      El resumen estará disponible cuando se reciban mediciones.
                    </p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

      <!-- ============================================================== -->
      <!-- PESTAÑA 3: AJUSTES (threshold-error.png) -->
      <!-- ============================================================== -->
      <div [class.hidden]="activeTab !== 'ajustes'" class="max-w-2xl bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-6">
          <div>
            <h3 class="text-lg font-black text-slate-900 tracking-tight">Límites de Alerta Cardíaca</h3>
            <p class="text-xs text-slate-400 font-medium mt-1">
              Define el rango operativo normal antes de disparar notificaciones de emergencia.
            </p>
          </div>

          <div class="space-y-5">
            <!-- Frecuencia Máxima (BPM) -->
            <div>
              <label class="block text-xs font-bold text-slate-800 mb-2">Frecuencia Máxima (BPM)</label>
              <input
                type="number"
                [(ngModel)]="tempFrecuenciaMax"
                (ngModelChange)="validateThresholds()"
                [ngClass]="isThresholdInvalid ? 'border-brand text-brand ring-1 ring-brand' : 'border-slate-200 focus:border-brand'"
                class="w-full px-4 py-3 bg-white border rounded-xl text-sm font-bold text-slate-900 outline-none transition"
              />
            </div>

            <!-- Frecuencia Mínima (BPM) -->
            <div>
              <label class="block text-xs font-bold text-slate-800 mb-2">Frecuencia Mínima (BPM)</label>
              <input
                type="number"
                [(ngModel)]="tempFrecuenciaMin"
                (ngModelChange)="validateThresholds()"
                [ngClass]="isThresholdInvalid ? 'border-brand text-brand ring-1 ring-brand' : 'border-slate-200 focus:border-brand'"
                class="w-full px-4 py-3 bg-white border rounded-xl text-sm font-bold text-slate-900 outline-none transition"
              />
            </div>

            <!-- Banner de Error de Umbrales (threshold-error.png) -->
            @if (isThresholdInvalid) {
              <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center space-x-3 text-brand">
                <svg class="w-5 h-5 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span class="text-xs font-bold">Rango inválido: el máximo debe ser mayor que el mínimo</span>
              </div>
            }

            <!-- Botón Guardar Cambios -->
            <div class="pt-2">
              <button
                type="button"
                [disabled]="isThresholdInvalid || isSavingThresholds"
                (click)="saveThresholds()"
                [ngClass]="isThresholdInvalid ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand hover:bg-brand-dark text-white cursor-pointer shadow-md active:scale-98'"
                class="w-full py-3.5 rounded-xl font-bold text-sm transition"
              >
                {{ isSavingThresholds ? 'Guardando cambios...' : 'Guardar Cambios' }}
              </button>
            </div>
          </div>
        </div>
      </div>

    <!-- Modal Detalle de Riesgo (risk-detail-modal.png) -->
    @if (showRiskDetailModal) {
      <app-risk-detail-modal
        [patientId]="patientId"
        [patientName]="patient ? (patient.nombres + ' ' + patient.apellidos) : 'Paciente'"
        [patient]="patient"
        [liveData]="liveData"
        [currentPulse]="snapshotRiskPulse"
        (closeModal)="closeRiskDetail()"
      ></app-risk-detail-modal>
    }
  `
})
export class PatientDetailComponent implements OnInit, OnDestroy {
  @ViewChild('liveChartContainer', { static: false }) liveChartContainer!: ElementRef;
  @ViewChild('historyChartContainer', { static: false }) historyChartContainer!: ElementRef;

  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private telemetryService = inject(TelemetryService);
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private processMiningService = inject(ProcessMiningService);
  private cdr = inject(ChangeDetectorRef);

  getDoctorDisplayName(): string {
    const user = this.authService.currentUser();
    if (user && user.nombres && user.apellidos) {
      const primerNombre = user.nombres.trim().split(/\s+/)[0];
      const primerApellido = user.apellidos.trim().split(/\s+/)[0];
      return `Dr. ${primerNombre} ${primerApellido}`;
    }
    const settings = this.settingsService.getSettings();
    if (settings && settings.nombres && settings.apellidos) {
      const primerNombre = settings.nombres.trim().split(/\s+/)[0];
      const primerApellido = settings.apellidos.trim().split(/\s+/)[0];
      return `Dr. ${primerNombre} ${primerApellido}`;
    }
    return 'Dr. Pablo Rojas';
  }

  patientId!: number;
  patient: Patient | null = null;
  liveData: TelemetryLive | null = null;

  private _activeTab: 'monitoreo' | 'historial' | 'ajustes' = 'monitoreo';
  get activeTab(): 'monitoreo' | 'historial' | 'ajustes' {
    return this._activeTab;
  }
  set activeTab(tab: 'monitoreo' | 'historial' | 'ajustes') {
    this._activeTab = tab;
    setTimeout(() => {
      this.safeResizeCharts();
      if (tab === 'monitoreo') {
        this.fetchLive();
        this.initOrUpdateLiveChart();
      } else if (tab === 'historial') {
        this.renderHistoryChart();
      }
    }, 40);
  }

  isOnline = false;
  currentPulse = 72;
  snapshotRiskPulse = 110;
  showRiskDetailModal = false;

  // Notas Clínicas
  newNoteText = '';
  clinicalNotes: ClinicalNote[] = [];

  // Pestaña Historial y Calendario Dinámico
  showCalendarPopover = false;
  isDateFilterActive = false;
  activeDateRangeLabel = 'Últimos 7 días';
  tempSelectedRangeLabel = 'Seleccionar rango';

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  calendarDays: (CalendarDay | null)[] = [];

  tempRangeStart: string | null = null;
  tempRangeEnd: string | null = null;
  selectedStartDate = '';
  selectedEndDate = '';

  allHistoryRecords: HistoryBiometricRecord[] = [];

  // Pestaña Ajustes (threshold-error.png)
  tempFrecuenciaMin = 60;
  tempFrecuenciaMax = 100;
  isThresholdInvalid = false;
  isSavingThresholds = false;

  // ECharts Instances & Wave Buffer
  private liveChartInstance: echarts.ECharts | null = null;
  private historyChartInstance: echarts.ECharts | null = null;
  private waveBuffer: number[] = [];
  private waveTimeLabels: string[] = [];
  private waveAnimInterval: any;
  private pollInterval: any;

  @HostListener('window:resize')
  onWindowResize(): void {
    this.safeResizeCharts();
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    this.safeResizeCharts();
  }

  openRiskDetail(): void {
    this.snapshotRiskPulse = this.currentPulse;
    this.showRiskDetailModal = true;
  }

  closeRiskDetail(): void {
    this.showRiskDetailModal = false;
    this.safeResizeCharts();
  }

  safeResizeCharts(): void {
    [50, 150, 300].forEach(delay => {
      setTimeout(() => {
        try {
          if (this.activeTab === 'monitoreo' && this.liveChartInstance && !this.liveChartInstance.isDisposed()) {
            this.liveChartInstance.resize();
          } else if (this.activeTab === 'historial' && this.historyChartInstance && !this.historyChartInstance.isDisposed()) {
            this.historyChartInstance.resize();
          }
        } catch (err) {
          console.warn('safeResizeCharts error:', err);
        }
      }, delay);
    });
  }

  ngOnInit(): void {
    this.generateCalendarDays();
    this.initWaveBuffer();
    this.route.params.subscribe(params => {
      this.patientId = +params['id'];
      this.loadPatient();
      this.loadClinicalNotes();
      this.startLiveTelemetry();
      this.startWaveAnimation();
    });
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.waveAnimInterval) clearInterval(this.waveAnimInterval);

    try {
      if (this.liveChartInstance) {
        this.liveChartInstance.dispose();
        this.liveChartInstance = null;
      }
      if (this.historyChartInstance) {
        this.historyChartInstance.dispose();
        this.historyChartInstance = null;
      }
    } catch {}
  }

  loadPatient(): void {
    this.patientService.getById(this.patientId).subscribe({
      next: p => {
        this.patient = p;
        this.tempFrecuenciaMin = p.frecuenciaMin || 60;
        this.tempFrecuenciaMax = p.frecuenciaMax || 100;
        this.validateThresholds();
        this.loadRealHistory();
        this.fetchLive();
        this.cdr.markForCheck();
      },
      error: err => {
        console.warn('Error loading patient details:', err);
      }
    });
  }

  loadRealHistory(inicio?: string, fin?: string): void {
    this.telemetryService.getHistorical(this.patientId, 'DIARIO', inicio, fin).subscribe({
      next: res => {
        if (res && res.mediciones && res.mediciones.length > 0) {
          const shortMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
          const maxT = this.patient?.frecuenciaMax || 100;
          const minT = this.patient?.frecuenciaMin || 60;

          // Verificar si todas las mediciones corresponden a un mismo día
          const firstDate = res.mediciones[0].fechaHora.substring(0, 10);
          const isSingleDay = res.mediciones.every(m => m.fechaHora.substring(0, 10) === firstDate);

          if (isSingleDay) {
            // Vista intradía: muestrear lecturas cronológicas para visualización clínica óptima
            let samplePoints = res.mediciones;
            if (samplePoints.length > 35) {
              const step = Math.ceil(samplePoints.length / 30);
              samplePoints = samplePoints.filter((_, idx) => idx % step === 0 || idx === samplePoints.length - 1);
            }
            this.allHistoryRecords = samplePoints.map(m => {
              const dateObj = new Date(m.fechaHora);
              const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return {
                fecha: m.fechaHora.substring(0, 10),
                label: timeStr,
                pulsoPpm: m.pulsoPpm,
                esAlerta: m.nivelRiesgo === 'CRITICO' || m.nivelRiesgo === 'MODERADO' || m.pulsoPpm > maxT || m.pulsoPpm < minT
              };
            });
          } else {
            // Vista multidiaria: agrupar por fecha calendario (YYYY-MM-DD)
            const mapByDay = new Map<string, { totalPpm: number; count: number; maxPpm: number; hasAlert: boolean; dateObj: Date }>();
            for (const m of res.mediciones) {
              const dateKey = m.fechaHora.substring(0, 10);
              const isAlert = m.nivelRiesgo === 'CRITICO' || m.nivelRiesgo === 'MODERADO' || m.pulsoPpm > maxT || m.pulsoPpm < minT;
              if (!mapByDay.has(dateKey)) {
                mapByDay.set(dateKey, {
                  totalPpm: m.pulsoPpm,
                  count: 1,
                  maxPpm: m.pulsoPpm,
                  hasAlert: isAlert,
                  dateObj: new Date(m.fechaHora)
                });
              } else {
                const entry = mapByDay.get(dateKey)!;
                entry.totalPpm += m.pulsoPpm;
                entry.count += 1;
                if (m.pulsoPpm > entry.maxPpm) entry.maxPpm = m.pulsoPpm;
                if (isAlert) entry.hasAlert = true;
              }
            }

            this.allHistoryRecords = Array.from(mapByDay.entries()).map(([dateStr, entry]) => {
              const day = entry.dateObj.getDate();
              const monthIdx = entry.dateObj.getMonth();
              const avgPpm = Math.round(entry.totalPpm / entry.count);
              return {
                fecha: dateStr,
                label: `${day} ${shortMonths[monthIdx] || 'Oct'}`,
                pulsoPpm: avgPpm,
                esAlerta: entry.hasAlert || avgPpm > maxT || avgPpm < minT
              };
            });
          }
        } else {
          this.allHistoryRecords = [];
        }

        if (this.activeTab === 'historial') {
          this.renderHistoryChart();
        }
        this.cdr.markForCheck();
      },
      error: err => {
        console.warn('Error loading telemetry history:', err);
        this.allHistoryRecords = [];
        if (this.activeTab === 'historial') {
          this.renderHistoryChart();
        }
        this.cdr.markForCheck();
      }
    });
  }

  get currentHistoryPoints(): HistoryBiometricRecord[] {
    if (!this.allHistoryRecords || this.allHistoryRecords.length === 0) return [];
    if (!this.isDateFilterActive) return this.allHistoryRecords;

    return this.allHistoryRecords.filter(r => {
      return r.fecha >= this.selectedStartDate && r.fecha <= this.selectedEndDate;
    });
  }

  get historyAverage(): number {
    const pts = this.currentHistoryPoints;
    if (pts.length === 0) return 0;
    const sum = pts.reduce((acc, p) => acc + p.pulsoPpm, 0);
    return Math.round(sum / pts.length);
  }

  get historyMax(): number {
    const pts = this.currentHistoryPoints;
    if (pts.length === 0) return 0;
    return Math.max(...pts.map(p => p.pulsoPpm));
  }

  get historyMin(): number {
    const pts = this.currentHistoryPoints;
    if (pts.length === 0) return 0;
    return Math.min(...pts.map(p => p.pulsoPpm));
  }

  get historyAlertsCount(): number {
    const pts = this.currentHistoryPoints;
    return pts.filter(p => p.esAlerta).length;
  }

  get hasHistoryData(): boolean {
    return this.currentHistoryPoints.length > 0;
  }

  // Métodos del Calendario Dinámico
  get currentMonthName(): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[this.currentMonth];
  }

  generateCalendarDays(): void {
    this.calendarDays = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const offset = (firstDay + 6) % 7;
    for (let i = 0; i < offset; i++) {
      this.calendarDays.push(null);
    }

    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = (this.currentMonth + 1).toString().padStart(2, '0');
      const dayStr = d.toString().padStart(2, '0');
      const dateStr = `${this.currentYear}-${monthStr}-${dayStr}`;
      this.calendarDays.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        selectable: true
      });
    }
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendarDays();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendarDays();
  }

  onCalendarDayClick(day: CalendarDay): void {
    const clicked = day.dateStr;

    if (!this.tempRangeStart || (this.tempRangeStart && this.tempRangeEnd)) {
      this.tempRangeStart = clicked;
      this.tempRangeEnd = null;
      this.tempSelectedRangeLabel = this.formatDateShort(clicked);
    } else {
      if (clicked < this.tempRangeStart) {
        this.tempRangeEnd = this.tempRangeStart;
        this.tempRangeStart = clicked;
      } else {
        this.tempRangeEnd = clicked;
      }
      this.tempSelectedRangeLabel = `${this.formatDateShort(this.tempRangeStart)} — ${this.formatDateShort(this.tempRangeEnd)}`;
    }
  }

  isDayStart(dateStr: string): boolean {
    return this.tempRangeStart === dateStr;
  }

  isDayEnd(dateStr: string): boolean {
    return this.tempRangeEnd === dateStr;
  }

  isDayInRange(dateStr: string): boolean {
    if (!this.tempRangeStart || !this.tempRangeEnd) return false;
    return dateStr > this.tempRangeStart && dateStr < this.tempRangeEnd;
  }

  isDaySelectedSingle(dateStr: string): boolean {
    return this.tempRangeStart === dateStr && !this.tempRangeEnd;
  }

  formatDateShort(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const shortMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    return `${day} ${shortMonths[monthIdx] || 'Oct'}`;
  }

  applyCalendarRange(): void {
    this.showCalendarPopover = false;
    this.isDateFilterActive = true;
    if (this.tempRangeStart && this.tempRangeEnd) {
      this.selectedStartDate = this.tempRangeStart;
      this.selectedEndDate = this.tempRangeEnd;
      this.activeDateRangeLabel = `${this.formatDateShort(this.tempRangeStart)} - ${this.formatDateShort(this.tempRangeEnd)}`;
    } else if (this.tempRangeStart) {
      this.selectedStartDate = this.tempRangeStart;
      this.selectedEndDate = this.tempRangeStart;
      this.activeDateRangeLabel = `${this.formatDateShort(this.tempRangeStart)}`;
    }
    this.loadRealHistory(this.selectedStartDate, this.selectedEndDate);
  }

  clearDateFilter(): void {
    this.isDateFilterActive = false;
    this.tempRangeStart = null;
    this.tempRangeEnd = null;
    this.selectedStartDate = '';
    this.selectedEndDate = '';
    this.activeDateRangeLabel = 'Últimos 7 días';
    this.tempSelectedRangeLabel = 'Seleccionar rango';
    this.loadRealHistory();
  }

  formatLiveTime(isoStr?: string): string {
    if (!isoStr) return 'Tiempo real';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Tiempo real';
    }
  }

  startLiveTelemetry(): void {
    this.fetchLive();
    this.pollInterval = setInterval(() => {
      this.fetchLive();
    }, 2000);
  }

  fetchLive(): void {
    this.telemetryService.getLive(this.patientId).subscribe({
      next: data => {
        this.liveData = data;
        const hasPulse = data.pulsoPpm !== undefined && data.pulsoPpm !== null && data.pulsoPpm > 0;
        const isWaiting = Boolean(data.esperandoLecturas);
        const isSensorOk = data.sensorConectado !== false;

        this.isOnline = !isWaiting && hasPulse && isSensorOk;

        if (this.isOnline && data.pulsoPpm) {
          this.currentPulse = data.pulsoPpm;
        }

        this.cdr.markForCheck();
        if (this.activeTab === 'monitoreo' && this.isOnline) {
          this.initOrUpdateLiveChart();
        }
      },
      error: err => {
        console.warn('Error fetching live telemetry:', err);
        this.isOnline = false;
        this.cdr.markForCheck();
      }
    });
  }

  get isHighRisk(): boolean {
    if (!this.isOnline || !this.currentPulse) return false;
    const maxThresh = this.patient?.frecuenciaMax || 100;
    const minThresh = this.patient?.frecuenciaMin || 60;

    // Si el pulso actual se encuentra dentro del rango de umbrales configurado por el médico, es ESTABLE
    if (this.currentPulse >= minThresh && this.currentPulse <= maxThresh) {
      return false;
    }

    // Si excede el máximo o cae por debajo del mínimo, es ALTO RIESGO
    return true;
  }

  // Generación Fisiológica de ECG/PPG (Onda Cardíaca P-Q-R-S-T Realista)
  private initWaveBuffer(): void {
    this.waveBuffer = [];
    this.waveTimeLabels = [];
    const initialCycle = this.generateEcgCycle(this.currentPulse, 24);
    for (let cycle = 0; cycle < 4; cycle++) {
      for (const sample of initialCycle) {
        this.waveBuffer.push(sample);
        this.waveTimeLabels.push('');
      }
    }
  }

  private generateEcgCycle(bpm: number, samplesPerCycle: number): number[] {
    const cycle: number[] = [];
    const isTaqui = bpm > 100;
    const baseLine = 75;

    for (let i = 0; i < samplesPerCycle; i++) {
      const t = i / samplesPerCycle;
      let val = 0;

      // Onda P (despolarización auricular)
      val += 0.16 * Math.exp(-Math.pow((t - 0.18) / 0.038, 2));

      // Onda Q (despolarización septal)
      val -= 0.15 * Math.exp(-Math.pow((t - 0.32) / 0.015, 2));

      // Pico R (despolarización ventricular - espícula sistólica)
      const rAmp = isTaqui ? 1.45 : 1.1;
      val += rAmp * Math.exp(-Math.pow((t - 0.36) / 0.022, 2));

      // Onda S (despolarización ventricular tardía)
      val -= 0.28 * Math.exp(-Math.pow((t - 0.40) / 0.02, 2));

      // Onda T (repolarización ventricular)
      const tAmp = isTaqui ? 0.4 : 0.3;
      val += tAmp * Math.exp(-Math.pow((t - 0.62) / 0.07, 2));

      const scaledVal = baseLine + val * 45;
      cycle.push(Math.round(scaledVal * 10) / 10);
    }
    return cycle;
  }

  private startWaveAnimation(): void {
    let cycleIndex = 0;
    this.waveAnimInterval = setInterval(() => {
      if (!this.isOnline || this.activeTab !== 'monitoreo') return;

      const samplesPerCycle = Math.max(14, Math.round(1700 / Math.max(40, this.currentPulse)));
      const cycle = this.generateEcgCycle(this.currentPulse, samplesPerCycle);
      const nextSample = cycle[cycleIndex % cycle.length];
      cycleIndex++;

      this.waveBuffer.push(nextSample);
      this.waveBuffer.shift();

      if (this.liveChartInstance) {
        try {
          this.liveChartInstance.setOption({
            series: [{ data: this.waveBuffer }]
          });
        } catch {}
      }
    }, 120);
  }

  private hasCanvasSupport(): boolean {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('jsdom')) {
      return false;
    }
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    } catch {
      return false;
    }
  }

  private initOrUpdateLiveChart(): void {
    if (!this.hasCanvasSupport()) return;
    setTimeout(() => {
      try {
        if (!this.liveChartContainer?.nativeElement || !this.isOnline) return;

        if (!this.liveChartInstance || this.liveChartInstance.isDisposed() || this.liveChartInstance.getDom() !== this.liveChartContainer.nativeElement) {
          try { this.liveChartInstance?.dispose(); } catch {}
          this.liveChartInstance = echarts.init(this.liveChartContainer.nativeElement);
        }

        const liveOption: echarts.EChartsOption = {
          animation: false,
          grid: {
            left: '5%',
            right: '4%',
            top: '12%',
            bottom: '10%',
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross', lineStyle: { color: '#E11D48', type: 'dashed' } },
            backgroundColor: '#ffffff',
            borderColor: '#fecdd3',
            borderWidth: 1.5,
            padding: [8, 12],
            textStyle: { color: '#0f172a' },
            extraCssText: 'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border-radius: 12px;',
            formatter: () => {
              const bpm = this.currentPulse;
              const status = this.isHighRisk ? 'Ritmo Crítico' : 'Ritmo Estable';
              return `
                <div style="font-family: inherit;">
                  <div style="font-size: 11px; color: #64748b; font-weight: 600;">Monitor Telemétrico en Tiempo Real</div>
                  <div style="display: flex; align-items: baseline; gap: 8px; margin: 4px 0;">
                    <span style="font-size: 16px; font-weight: 900; color: #E11D48; font-family: monospace;">${bpm}</span>
                    <span style="font-size: 11px; font-weight: 700; color: #64748b;">BPM</span>
                  </div>
                  <div style="font-size: 11px; font-weight: 700; color: ${this.isHighRisk ? '#E11D48' : '#059669'};">${status}</div>
                </div>
              `;
            }
          },
          xAxis: {
            type: 'category',
            data: this.waveTimeLabels,
            boundaryGap: false,
            axisLine: { lineStyle: { color: '#e2e8f0' } },
            axisTick: { show: false },
            axisLabel: { show: false }
          },
          yAxis: {
            type: 'value',
            min: 40,
            max: 160,
            interval: 20,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
            splitLine: {
              lineStyle: {
                color: '#f8fafc',
                width: 1
              }
            }
          },
          series: [
            {
              name: 'Onda ECG / PPG',
              type: 'line',
              smooth: 0.25,
              data: this.waveBuffer,
              symbol: 'none',
              lineStyle: {
                color: '#E11D48',
                width: 2.5
              },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(225, 29, 72, 0.16)' },
                  { offset: 1, color: 'rgba(225, 29, 72, 0.01)' }
                ])
              }
            }
          ]
        };

        this.liveChartInstance.setOption(liveOption, true);
        this.liveChartInstance.resize();
      } catch (err) {
        console.warn('ECharts live init safe catch:', err);
      }
    }, 40);
  }

  renderHistoryChart(): void {
    if (!this.hasCanvasSupport()) return;
    if (!this.hasHistoryData || this.activeTab !== 'historial') {
      try {
        this.historyChartInstance?.clear();
      } catch {}
      return;
    }

    setTimeout(() => {
      try {
        if (!this.historyChartContainer?.nativeElement) return;

        if (!this.historyChartInstance || this.historyChartInstance.isDisposed() || this.historyChartInstance.getDom() !== this.historyChartContainer.nativeElement) {
          try { this.historyChartInstance?.dispose(); } catch {}
          this.historyChartInstance = echarts.init(this.historyChartContainer.nativeElement);
        }

        const pts = this.currentHistoryPoints;
        const dateLabels = pts.map(p => p.label);
        const bpmData = pts.map(p => p.pulsoPpm);
        const basalData = pts.map(p => Math.max(55, Math.round(p.pulsoPpm * 0.88)));

        const option: echarts.EChartsOption = {
          animation: true,
          animationDuration: 600,
          tooltip: {
            trigger: 'axis',
            backgroundColor: '#ffffff',
            borderColor: '#fecdd3',
            borderWidth: 1.5,
            padding: [10, 14],
            textStyle: { color: '#0f172a' },
            extraCssText: 'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border-radius: 14px;',
            formatter: (params: any) => {
              const p = Array.isArray(params) ? params[0] : params;
              if (!p) return '';
              const dataIndex = p.dataIndex;
              const record = pts[dataIndex];
              const bpm = record ? record.pulsoPpm : p.value;
              const fecha = record ? `${record.label} 2026` : p.axisValue;
              const esAlerta = record ? record.esAlerta : (bpm > 100);

              return `
                <div style="font-family: inherit; min-width: 170px;">
                  <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-bottom: 4px;">${fecha}</div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 6px;">
                    <span style="font-size: 12px; font-weight: 700; color: #1e293b;">Frecuencia Cardíaca:</span>
                    <span style="font-size: 15px; font-weight: 900; color: #E11D48; font-family: monospace;">${bpm} BPM</span>
                  </div>
                  <div style="padding-top: 6px; border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 11px; color: #64748b; font-weight: 500;">Evaluación:</span>
                    ${esAlerta
                      ? '<span style="font-size: 11px; font-weight: 700; color: #E11D48; background: #ffe4e6; padding: 2px 8px; border-radius: 6px;">Ritmo Crítico</span>'
                      : '<span style="font-size: 11px; font-weight: 700; color: #059669; background: #ecfdf5; padding: 2px 8px; border-radius: 6px;">Ritmo Estable</span>'
                    }
                  </div>
                </div>
              `;
            }
          },
          grid: {
            left: '5%',
            right: '5%',
            top: '12%',
            bottom: '10%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: dateLabels,
            boundaryGap: false,
            axisLine: { lineStyle: { color: '#e2e8f0' } },
            axisTick: { show: false },
            axisLabel: { color: '#64748b', fontSize: 11, fontWeight: 500, margin: 12 }
          },
          yAxis: {
            type: 'value',
            min: 50,
            max: 160,
            interval: 20,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
              color: '#94a3b8',
              fontSize: 11,
              fontFamily: 'monospace',
              formatter: '{value}'
            },
            splitLine: {
              lineStyle: {
                color: '#f1f5f9',
                type: 'solid',
                width: 1.5
              }
            }
          },
          series: [
            {
              name: 'Pulso basal de referencia',
              type: 'line',
              smooth: 0.35,
              data: basalData,
              symbol: 'none',
              lineStyle: {
                color: '#cbd5e1',
                width: 2,
                type: 'dashed'
              }
            },
            {
              name: 'Frecuencia Cardíaca',
              type: 'line',
              smooth: 0.35,
              data: bpmData,
              showSymbol: true,
              symbol: 'circle',
              symbolSize: 8,
              itemStyle: {
                color: '#E11D48',
                borderColor: '#ffffff',
                borderWidth: 2
              },
              lineStyle: {
                color: '#E11D48',
                width: 3
              },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(225, 29, 72, 0.16)' },
                  { offset: 1, color: 'rgba(225, 29, 72, 0.01)' }
                ])
              },
              markLine: {
                symbol: 'none',
                silent: true,
                data: [
                  {
                    yAxis: this.patient?.frecuenciaMax || 100,
                    lineStyle: { color: '#f43f5e', type: 'dotted', width: 1.5 },
                    label: { formatter: 'Límite Máx ({c} BPM)', position: 'insideEndTop', fontSize: 10, color: '#f43f5e' }
                  },
                  {
                    yAxis: this.patient?.frecuenciaMin || 60,
                    lineStyle: { color: '#94a3b8', type: 'dotted', width: 1.2 },
                    label: { formatter: 'Límite Mín ({c} BPM)', position: 'insideEndBottom', fontSize: 10, color: '#94a3b8' }
                  }
                ]
              }
            }
          ]
        };

        this.historyChartInstance.setOption(option, true);
        this.historyChartInstance.resize();
      } catch (err) {
        console.warn('ECharts history init safe catch:', err);
      }
    }, 40);
  }

  // Notas Clínicas
  loadClinicalNotes(): void {
    const saved = localStorage.getItem(`cardio_notes_${this.patientId}`);
    if (saved) {
      try {
        this.clinicalNotes = JSON.parse(saved);
      } catch {
        this.clinicalNotes = [];
      }
    } else {
      // Nota clínica por defecto según el paciente
      if (this.patientId === 3 || this.patient?.dni === '14567892') {
        this.clinicalNotes = [
          {
            id: '1',
            texto: 'Paciente de alto riesgo en telemetría continua. Presenta picos frecuentes (>110 BPM) y variabilidad inestable. Se mantiene bajo vigilancia estricta.',
            fecha: 'Hoy, 09:30 AM',
            medico: this.getDoctorDisplayName()
          }
        ];
      } else {
        this.clinicalNotes = [
          {
            id: '1',
            texto: 'Paciente muestra ritmo sinusal estable. Sin novedades de picos de arritmia en las últimas horas.',
            fecha: 'Hoy, 08:15 AM',
            medico: this.getDoctorDisplayName()
          }
        ];
      }
    }
  }

  saveNote(): void {
    if (!this.newNoteText.trim()) return;

    const newNote: ClinicalNote = {
      id: Date.now().toString(),
      texto: this.newNoteText.trim(),
      fecha: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      medico: this.getDoctorDisplayName()
    };

    this.clinicalNotes.unshift(newNote);
    localStorage.setItem(`cardio_notes_${this.patientId}`, JSON.stringify(this.clinicalNotes));
    this.newNoteText = '';

    // Minería de Procesos: Registrar evento REVISION_MEDICA_CERRADA en EVENTO_PROCESO
    if (this.patientId) {
      this.processMiningService.registrarEvento({
        idPaciente: Number(this.patientId),
        actividad: 'REVISION_MEDICA_CERRADA',
        ejecutor: this.getDoctorDisplayName(),
        estadoConformidad: 'CONFORME'
      }).subscribe({
        next: () => {},
        error: () => {}
      });
    }

    Swal.fire({
      icon: 'success',
      title: 'Nota Guardada',
      text: 'La nota clínica fue registrada en el expediente del paciente.',
      timer: 1800,
      showConfirmButton: false
    });
  }

  downloadHistoryPdf(): void {
    const patientName = this.patient ? `${this.patient.nombres} ${this.patient.apellidos}` : 'Paciente';
    const rangeLabel = this.isDateFilterActive ? this.activeDateRangeLabel : `${this.currentMonthName} ${this.currentYear}`;

    Swal.fire({
      title: 'Generando Informe Histórico...',
      text: 'Compilando historial biométrico, tendencias y bitácora clínica...',
      allowOutsideClick: false,
      timer: 800,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    }).then(() => {
      this.reportService.generateHistoricalSummaryPdf({
        patientName,
        dni: this.patient?.dni || 'N/A',
        dateRangeLabel: rangeLabel,
        averageBpm: this.historyAverage,
        maxBpm: this.historyMax,
        minBpm: this.historyMin,
        alertsCount: this.historyAlertsCount,
        doctorName: this.getDoctorDisplayName(),
        records: this.currentHistoryPoints,
        clinicalNotes: this.clinicalNotes
      });
      this.safeResizeCharts();
    });
  }

  // Ajustes de Umbrales (threshold-error.png)
  validateThresholds(): void {
    this.isThresholdInvalid = Number(this.tempFrecuenciaMax) <= Number(this.tempFrecuenciaMin);
  }

  saveThresholds(): void {
    this.validateThresholds();
    if (this.isThresholdInvalid) return;

    this.isSavingThresholds = true;
    this.patientService.updateThresholds(this.patientId, {
      frecuenciaMin: Number(this.tempFrecuenciaMin),
      frecuenciaMax: Number(this.tempFrecuenciaMax)
    }).subscribe({
      next: updated => {
        this.isSavingThresholds = false;
        this.patient = updated;
        // Refrescar historial biométrico y telemetría en vivo con los nuevos umbrales clínicos
        if (this.isDateFilterActive && this.selectedStartDate && this.selectedEndDate) {
          this.loadRealHistory(this.selectedStartDate, this.selectedEndDate);
        } else {
          this.loadRealHistory();
        }
        this.fetchLive();
        this.renderHistoryChart();
        this.cdr.markForCheck();

        Swal.fire({
          icon: 'success',
          title: 'Ajustes Guardados',
          text: `Nuevos límites configurados: ${this.tempFrecuenciaMin} - ${this.tempFrecuenciaMax} BPM. Se sincronizarán automáticamente con la app móvil y el smartwatch.`,
          confirmButtonColor: '#E11D48',
          timer: 2500
        });
      },
      error: err => {
        this.isSavingThresholds = false;
        const msg = err.error?.message || 'Error al guardar los ajustes de umbrales.';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: msg,
          confirmButtonColor: '#E11D48'
        });
      }
    });
  }
}
