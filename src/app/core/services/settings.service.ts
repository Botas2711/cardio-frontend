import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from './auth.service';

export interface SystemSettings {
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  sonidoAlerta: boolean;
  frecuenciaMinDefecto: number;
  frecuenciaMaxDefecto: number;
}

export const SETTINGS_STORAGE_KEY = 'cardio_system_settings';
export const DEFAULT_MIN_BPM = 60;
export const DEFAULT_MAX_BPM = 100;

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private authService = inject(AuthService);

  private readonly defaultSettings: SystemSettings = {
    nombres: 'Pablo',
    apellidos: 'Rojas',
    dni: '91705963',
    correo: 'pablorojas01@gmail.com',
    sonidoAlerta: true,
    frecuenciaMinDefecto: DEFAULT_MIN_BPM,
    frecuenciaMaxDefecto: DEFAULT_MAX_BPM
  };

  public currentSettings = signal<SystemSettings>(this.loadInitialSettings());

  private loadInitialSettings(): SystemSettings {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return {
            ...this.defaultSettings,
            ...parsed
          };
        } catch {
          // Fallback a los datos por defecto si falla el parseo
        }
      }
    }

    // Si hay un usuario en sesión, sincronizar datos iniciales
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      return {
        ...this.defaultSettings,
        nombres: currentUser.nombres || this.defaultSettings.nombres,
        apellidos: currentUser.apellidos || this.defaultSettings.apellidos,
        dni: currentUser.dni || this.defaultSettings.dni,
        correo: currentUser.correo || this.defaultSettings.correo
      };
    }

    return { ...this.defaultSettings };
  }

  getSettings(): SystemSettings {
    return this.currentSettings();
  }

  saveSettings(newSettings: SystemSettings): void {
    this.currentSettings.set({ ...newSettings });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    }
  }

  isSoundEnabled(): boolean {
    return this.currentSettings().sonidoAlerta;
  }

  getDefaultMinBpm(): number {
    return Number(this.currentSettings().frecuenciaMinDefecto) || DEFAULT_MIN_BPM;
  }

  getDefaultMaxBpm(): number {
    return Number(this.currentSettings().frecuenciaMaxDefecto) || DEFAULT_MAX_BPM;
  }

  // Reproducción de alerta sonora médica vía Web Audio API nativo
  playAlertSound(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // Secuencia de alerta dual hospitalaria (A5 880Hz -> C6 1046.5Hz)
      playTone(880, now, 0.16);
      playTone(1046.5, now + 0.18, 0.28);
    } catch (err) {
      console.warn('AudioContext notification alert playback warning:', err);
    }
  }
}
