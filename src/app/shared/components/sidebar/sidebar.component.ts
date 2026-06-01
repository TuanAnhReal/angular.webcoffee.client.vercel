import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  public authService = inject(AuthService);

  openGroups = signal<Record<string, boolean>>({
    'quan-ly': true,
    'order': true,
    'pha-che': true,
  });

  toggleGroup(group: string) {
    this.openGroups.update(state => ({
      ...state,
      [group]: !state[group]
    }));
  }

  isOpen(group: string): boolean {
    return this.openGroups()[group] ?? true;
  }
}