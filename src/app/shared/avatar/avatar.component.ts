import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent implements OnChanges {
  @Input() name: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  initials = '';
  bgColor = '';

  private readonly COLORS = [
    '#1a73e8', '#d93025', '#f29900', '#1e8e3e',
    '#e52592', '#9334e6', '#007b83', '#e37400'
  ];

  ngOnChanges(): void {
    this.initials = this.getInitials(this.name);
    this.bgColor = this.getColor(this.name);
  }

  private getInitials(name: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  private getColor(name: string): string {
    if (!name?.trim()) return this.COLORS[0];
    const index = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % this.COLORS.length;
    return this.COLORS[index];
  }
}