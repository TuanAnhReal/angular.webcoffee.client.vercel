import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { HoaDonService } from '../../services/hoa-don.service';
import { KhachHangService } from '../../../khach-hang/services/khach-hang.service';
import { NhanVienService } from '../../../nhan-vien/services/nhan-vien.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-hoa-don-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hoa-don-detail.component.html'
})
export class HoaDonDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private hoaDonService = inject(HoaDonService);
  private khachHangService = inject(KhachHangService);
  private nhanVienService = inject(NhanVienService);

  invoice: any = null;
  isLoading = true;

  customerName = 'Khách vãng lai';
  customerPhone = '---';
  customerPoints = 0;
  customerAvatar = 'K';
  employeePV = '---';
  employeePC = '---';
  
  tongTienHangGoc = 0;
  tongGiamGiaSP = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadData(id);
  }

  loadData(id: string): void {
    this.isLoading = true;
    
    forkJoin({
      invoiceRes: this.hoaDonService.getById(id),
      customersRes: this.khachHangService.getAll(),
      employeesRes: this.nhanVienService.getAll()
    }).subscribe({
      next: (results) => {
        if (results.invoiceRes?.success) this.invoice = results.invoiceRes.data;
        
        const customers = results.customersRes?.success ? results.customersRes.data : [];
        const employees = results.employeesRes?.success ? results.employeesRes.data : [];

        if (this.invoice) {
          const cus = customers.find((c: any) => c.maKH === this.invoice.maKH);
          if (cus) {
            this.customerName = cus.tenKH || 'Khách vãng lai';
            this.customerPhone = cus.sdtkh || '---';
            this.customerPoints = cus.diemTichLuy || 0;
            this.customerAvatar = this.getInitials(this.customerName);
          } else if (this.invoice.maKH && this.invoice.maKH !== 'Khách vãng lai') {
             this.customerName = this.invoice.maKH; 
          }

          const nvPV = employees.find((e: any) => e.maNV === this.invoice.maNV_PV);
          if (nvPV) this.employeePV = `${nvPV.hoNV} ${nvPV.tenNV}`;
          
          const nvPC = employees.find((e: any) => e.maNV === this.invoice.maNV_PC);
          if (nvPC) this.employeePC = `${nvPC.hoNV} ${nvPC.tenNV}`;

          if (this.invoice.chiTietHoaDons && Array.isArray(this.invoice.chiTietHoaDons)) {
            this.tongGiamGiaSP = this.invoice.chiTietHoaDons.reduce((sum: number, item: any) => sum + (item.giamGia || 0), 0);
            this.tongTienHangGoc = this.invoice.chiTietHoaDons.reduce((sum: number, item: any) => sum + (item.thanhTien + (item.giamGia || 0)), 0);
          }
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải chi tiết hóa đơn:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(name: string): string {
    if (!name || name === 'Khách vãng lai') return 'K';
    const words = name.trim().split(' ');
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  changeStatus(newStatus: string): void {
    if (!this.invoice) return;
    
    // 🌟 REFACTOR LUỒNG THÔNG BÁO XÁC NHẬN CHUẨN POS
    let confirmMsg = `Bạn có chắc chắn muốn đổi trạng thái thành "${newStatus}"?`;
    
    if (newStatus === 'Đã thanh toán') {
      const formattedTotal = this.invoice.tongTien ? this.invoice.tongTien.toLocaleString('vi-VN') : '0';
      confirmMsg = `Bạn xác nhận thanh toán hóa đơn ${this.invoice.soHD}?\n\nTổng thanh toán:\n${formattedTotal}đ`;
    }
    if (newStatus === 'Đã hủy') {
      confirmMsg = `Bạn có chắc muốn hủy hóa đơn này?\n\nHành động này không thể hoàn tác.`;
    }

    if (confirm(confirmMsg)) {
      this.hoaDonService.updateStatus(this.invoice.soHD, newStatus).subscribe({
        next: (res) => {
          if (res.success) {
            // Hiển thị Toast thông báo giả lập nhẹ nhàng
            alert(newStatus === 'Đã thanh toán' ? 'Thanh toán thành công!' : 'Hóa đơn đã bị hủy!');
            this.loadData(this.invoice.soHD); // Reload dữ liệu trực tiếp
          }
        },
        error: (err) => {
          console.error('Lỗi API cập nhật:', err);
          alert('Thao tác thất bại. Vui lòng thử lại!');
        }
      });
    }
  }

async exportPdf(): Promise<void> {

  const element = document.getElementById('invoice-print');

  if (!element) {
    console.error('Không tìm thấy invoice-print');
    return;
  }

  element.style.visibility = 'visible';

  const canvas = await html2canvas(element, {
    scale: 2
  });

    element.style.visibility = 'hidden';

  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = 190;
  const pdfHeight = canvas.height * pdfWidth / canvas.width;

  pdf.addImage(
    imgData,
    'PNG',
    10,
    10,
    pdfWidth,
    pdfHeight
  );

  pdf.save(`HoaDon-${this.invoice?.soHD}.pdf`);
}
}