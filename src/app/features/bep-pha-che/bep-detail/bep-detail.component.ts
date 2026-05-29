import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/auth/services/auth.service';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-bep-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bep-detail.component.html'
})
export class BepDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService); // Inject để lấy mã nhân viên pha chế
  private apiUrl = environment.apiUrl;

  soHD = '';
  isLoading = true;
  invoiceInfo: any = null; // Thông tin chung hóa đơn
  invoiceDetails: any[] = []; // Mảng danh sách các món nước trong đơn

  ngOnInit(): void {
    this.soHD = this.route.snapshot.paramMap.get('id') || '';
    if (this.soHD) {
      this.getInvoiceDetailData();
    }
  }

  getInvoiceDetailData(): void {
    this.isLoading = true;

    // Lấy thông tin hóa đơn hiện tại và danh mục sản phẩm để map tên món
    forkJoin({
      hoaDon: this.http.get<any>(`${this.apiUrl}/HoaDons/${this.soHD}` || `${this.apiUrl}/HoaDons/${this.soHD}`),
      sanPhams: this.http.get<any>(`${this.apiUrl}/SanPhams`)
    }).subscribe({
      next: (res) => {
        this.invoiceInfo = res.hoaDon?.success ? res.hoaDon.data : res.hoaDon;
        const allProducts = res.sanPhams?.success ? res.sanPhams.data : (Array.isArray(res.sanPhams) ? res.sanPhams : []);

        const rawDetails = this.invoiceInfo.chiTietHoaDons || this.invoiceInfo.cthds || [];
        
        // Xây dựng mảng hiển thị món nước đẹp mắt
        this.invoiceDetails = rawDetails.map((ct: any) => {
          const sp = allProducts.find((p: any) => p.maSp === ct.maSP);
          return {
            tenSp: sp?.tenSp || ct.tenSp || 'Sản phẩm ' + ct.maSP,
            hinhAnh: sp?.hinhAnh || null,
            kichThuoc: sp?.kichThuoc || 'Mặc định',
            slsp: ct.slsp || 1
          };
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi lấy chi tiết hóa đơn bếp:', err);
        alert('Không tìm thấy dữ liệu hóa đơn này!');
        this.router.navigate(['/admin/bep-pha-che']);
      }
    });
  }

  // Thao tác bấm xác nhận HOÀN THÀNH ĐƠN HÀNG
onCompleteOrder(): void {
    const currentUser = this.authService.currentUser();
    
    // 🔍 ĐỌC LOG LOGIN CŨ CỦA BẠN: Backend trả về chính xác chữ "MaNV"
    // Ta ưu tiên đọc "MaNV", sau đó mới đến các claim hệ thống, cuối cùng là chuỗi dự phòng ngắn gọn 5 ký tự
    const maNhanVienPhaChe = currentUser 
      ? (currentUser as any).MaNV || (currentUser as any).unique_name || (currentUser as any).nameid || 'BARIS' 
      : 'BARIS';

    const updateBody = {
      trangThaiHD: "Hoàn thành",
      maNV_PC: maNhanVienPhaChe
    };

    this.http.put<any>(`${this.apiUrl}/HoaDons/${this.soHD}/complete-kitchen`, updateBody).subscribe({
      next: (res) => {
        alert(`Đã hoàn thành đơn hàng ${this.soHD}!`);
        this.router.navigate(['/admin/bep-pha-che']);
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái hoàn thành!');
      }
    });
  }
}