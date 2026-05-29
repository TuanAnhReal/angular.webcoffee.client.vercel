import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-bep-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bep-dashboard.component.html'
})
export class BepDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = environment.apiUrl;

  isLoading = true;
  todayInvoices: any[] = []; // Danh sách hóa đơn trong ngày

  ngOnInit(): void {
    this.loadTodayInvoices();
  }

  loadTodayInvoices(): void {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/HoaDons` || `${this.apiUrl}/HoaDons`).subscribe({
      next: (res) => {
        const allInvoices = res.success ? res.data : (Array.isArray(res) ? res : []);
        
        // Lấy ngày hôm nay định dạng YYYY-MM-DD
        const todayStr = new Date().toISOString().split('T')[0];

        // Lọc hóa đơn: Trạng thái "Chưa thanh toán" VÀ được tạo trong ngày hôm nay
        this.todayInvoices = allInvoices.filter((hd: any) => {
          const status = hd.trangThaiHD ? hd.trangThaiHD.trim() : '';
          const invoiceDate = hd.tgVao ? hd.tgVao.split('T')[0] : '';
          return status === 'Chưa thanh toán' && invoiceDate === todayStr;
        });

        // Sắp xếp đơn cũ lên trước để pha chế làm theo thứ tự xếp hàng
        this.todayInvoices.sort((a, b) => new Date(a.tgVao).getTime() - new Date(b.tgVao).getTime());

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải danh sách hóa đơn:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}