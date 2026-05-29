import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardSummary } from '../service/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef); 

  summaryData: DashboardSummary | null = null;

  ngOnInit(): void {
    this.loadDashboardSummary();
  }

  loadDashboardSummary(): void {
    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        this.summaryData = res;
        this.cdr.detectChanges(); // Khởi chạy cơ chế render cập nhật dữ liệu lên UI ngay lập tức
      },
      error: (err) => {
        console.error('Lỗi hệ thống khi tải dữ liệu Dashboard:', err);
        this.cdr.detectChanges(); 
      }
    });
  }
}