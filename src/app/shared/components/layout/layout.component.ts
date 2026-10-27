import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent],
  template: `
    <div class="min-h-screen bg-slate-50/70 flex font-sans select-none antialiased">
      <!-- Sidebar Izquierdo a Altura Completa (dashboard.png) -->
      <app-sidebar></app-sidebar>

      <!-- Panel Derecho: Navbar Superior + Contenido Dinámico -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-navbar></app-navbar>

        <main class="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/70">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent {}
