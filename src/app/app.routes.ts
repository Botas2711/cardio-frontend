import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'triage',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        redirectTo: 'triage',
        pathMatch: 'full'
      },
      {
        path: 'triage',
        loadComponent: () => import('./features/triage/patient-list/patient-list.component').then(m => m.PatientListComponent)
      },
      {
        path: 'ajustes',
        loadComponent: () => import('./features/settings/system-settings/system-settings.component').then(m => m.SystemSettingsComponent)
      },
      {
        path: 'patient-management',
        redirectTo: 'ajustes',
        pathMatch: 'full'
      },
      {
        path: 'patient-management/new',
        loadComponent: () => import('./features/patient-management/patient-form/patient-form.component').then(m => m.PatientFormComponent)
      },
      {
        path: 'live-monitoring/:id',
        loadComponent: () => import('./features/live-monitoring/patient-detail/patient-detail.component').then(m => m.PatientDetailComponent)
      },
      {
        path: 'historical-analytics/:id',
        loadComponent: () => import('./features/historical-analytics/telemetry-charts/telemetry-charts.component').then(m => m.TelemetryChartsComponent)
      },
      {
        path: 'process-audit',
        loadComponent: () => import('./features/process-audit/process-audit.component').then(m => m.ProcessAuditComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/clinical-summary/clinical-summary.component').then(m => m.ClinicalSummaryComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'triage'
  }
];
