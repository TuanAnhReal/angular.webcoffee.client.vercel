import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { HoaDonService } from '../../services/hoa-don.service';
import { KhachHangService } from '../../../khach-hang/services/khach-hang.service';
import { SanPhamService } from '../../../san-pham/services/san-pham.service';
import { NhanVienService } from '../../../nhan-vien/services/nhan-vien.service';

@Component({
  selector: 'app-hoa-don-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hoa-don-detail.component.html'
})
export class HoaDonDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private hoaDonService = inject(HoaDonService);
  private khachHangService = inject(KhachHangService);
  private sanPhamService = inject(SanPhamService);
  private nhanVienService = inject(NhanVienService);

  invoice: any = null;
  isLoading = true;

  customerName = 'Khách vãng lai';
  customerPhone = '---';
  customerPoints = 0;
  customerAvatar = 'KH';
  employeePV = '---';
  employeePC = '---';
  subTotal = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadData(id);
  }

  loadData(id: string): void {
    this.isLoading = true;
    
    forkJoin({
      invoiceRes: this.hoaDonService.getById(id),
      customersRes: this.khachHangService.getAll(),
      productsRes: this.sanPhamService.getAll(),
      employeesRes: this.nhanVienService.getAll()
    }).subscribe({
      next: (results) => {
        if (results.invoiceRes?.success) this.invoice = results.invoiceRes.data;
        
        const customers = results.customersRes?.success ? results.customersRes.data : [];
        const products = results.productsRes?.success ? results.productsRes.data : [];
        const employees = results.employeesRes?.success ? results.employeesRes.data : [];

        // XỬ LÝ MAP DỮ LIỆU NGAY TẠI ĐÂY AN TOÀN TUYỆT ĐỐI
        if (this.invoice) {
          // 1. Map Khách hàng
          const cus = customers.find((c: any) => c.maKH === this.invoice.maKH);
          if (cus) {
            this.customerName = cus.tenKH || 'Khách vãng lai';
            this.customerPhone = cus.sdtkh || '---';
            this.customerPoints = cus.diemTichLuy || 0;
            this.customerAvatar = this.getInitials(this.customerName);
          }

          // 2. Map Nhân viên
          const nvPV = employees.find((e: any) => e.maNV === this.invoice.maNV_PV);
          if (nvPV) this.employeePV = `${nvPV.hoNV} ${nvPV.tenNV}`;
          
          const nvPC = employees.find((e: any) => e.maNV === this.invoice.maNV_PC);
          if (nvPC) this.employeePC = `${nvPC.hoNV} ${nvPC.tenNV}`;

          // 3. Map Sản phẩm và Tính tiền
          if (this.invoice.chiTietHoaDons && Array.isArray(this.invoice.chiTietHoaDons)) {
            this.subTotal = 0;
            this.invoice.chiTietHoaDons.forEach((item: any) => {
              const sp = products.find((p: any) => p.maSp === item.maSP);
              item.tenSp = sp?.tenSp || item.maSP; // Gắn thẳng tên SP vào mảng chi tiết
              item.hinhAnh = sp?.hinhAnh || null;
              item.kichThuoc = sp?.kichThuoc || 'Mặc định';
              this.subTotal += (item.thanhTien || 0);
            });
          }
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'KH';
    const words = name.trim().split(' ');
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  changeStatus(newStatus: string): void {
    if (!this.invoice) return;

    const confirmMsg = newStatus === 'Đã thanh toán' 
      ? 'Xác nhận thanh toán hóa đơn này?' 
      : `Bạn có chắc muốn đổi trạng thái thành ${newStatus}?`;

    if (confirm(confirmMsg)) {
      this.hoaDonService.updateStatus(this.invoice.soHD, newStatus).subscribe({
        next: (res) => {
          if (res.success) {
            alert(res.message);
            // Load lại dữ liệu mới nhất để thấy giờ ra và trạng thái đổi
            this.loadData(this.invoice.soHD); 
          }
        },
        error: (err) => {
          console.error('Lỗi đổi trạng thái:', err);
          alert('Có lỗi xảy ra, vui lòng thử lại!');
        }
      });
    }
  }

  printInvoice(): void {
    window.print();
  }
}