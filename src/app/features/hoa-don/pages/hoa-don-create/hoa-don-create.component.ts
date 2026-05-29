import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators'; // 👉 BỔ SUNG: Toán tử chuyển đổi luồng async

import { HoaDonService } from '../../services/hoa-don.service';
import { SanPhamService, SanPhamVm } from '../../../san-pham/services/san-pham.service';
import { KhachHangService, KhachHangVm } from '../../../khach-hang/services/khach-hang.service';
import { KhuVucBanService, KhuVucVm, BanVm } from '../../../khuvuc-ban/services/khu-vuc-ban.service';

export interface CartItem {
  product: SanPhamVm;
  quantity: number;
  giamGia: number;
}

@Component({
  selector: 'app-hoa-don-create',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './hoa-don-create.component.html'
})
export class HoaDonCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hoaDonService = inject(HoaDonService);
  private sanPhamService = inject(SanPhamService);
  private khachHangService = inject(KhachHangService);
  private router = inject(Router);
  private KhuVucBanService = inject(KhuVucBanService);
  invoiceForm!: FormGroup;
  
  // Dữ liệu master
  products: SanPhamVm[] = [];
  filteredProducts: SanPhamVm[] = [];
  customers: KhachHangVm[] = [];
  areas: KhuVucVm[] = [];
  filteredTables: BanVm[] = [];
  
  // Giỏ hàng & Trạng thái
  cart: CartItem[] = [];
  isLoading = true;
  isSubmitting = false;
  activeCategory = 'Tất cả';

  customerNameDisplay = 'Khách vãng lai';
  currentAreaSurcharge = 0;
  currentUser: any = null; // Chứa thông tin NV đang login

  ngOnInit(): void {
    this.initForm();
    this.loadMasterData();
    this.loadCurrentUser();
  }

  initForm(): void {
    this.invoiceForm = this.fb.group({
      sdtKH: [''],
      maKH: [''],
      soKV: ['', Validators.required],
      soBan: ['', Validators.required],
      giamGiaHD: [0, Validators.min(0)],
      ghiChuHD: ['']
    });
  }

  loadCurrentUser(): void {
    this.currentUser = {
      maNV: 'NV01',
      hoTen: 'Nguyễn Văn Admin',
      role: 'Nhân viên phục vụ'
    };
  }

  loadMasterData(): void {
    forkJoin({
      products: this.sanPhamService.getAll(),
      customers: this.khachHangService.getAll(),
      areas: this.KhuVucBanService.getAllNested()
    }).subscribe({
      next: ({ products, customers, areas }) => {
        if (products.success) {
          this.products = products.data.filter(p => p.trangThai === 'Đang bán');
          this.filteredProducts = this.products;
        }
        if (customers.success) this.customers = customers.data;
        if (areas.success) this.areas = areas.data;
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi tải dữ liệu:', err);
        this.isLoading = false;
      }
    });
  }

  // --- LOGIC TÌM KIẾM KHÁCH HÀNG LIVE TRÊN FORM ---
  onPhoneChange(event: Event): void {
    const phone = (event.target as HTMLInputElement).value.trim();
    const found = this.customers.find(c => c.sdtkh === phone);
    
    if (found) {
      this.invoiceForm.patchValue({ maKH: found.maKH });
      this.customerNameDisplay = found.tenKH;
    } else {
      this.invoiceForm.patchValue({ maKH: '' });
      this.customerNameDisplay = 'Khách vãng lai';
    }
  }

  // --- LOGIC KHU VỰC -> BÀN ---
  onAreaChange(event: Event): void {
    const soKV = (event.target as HTMLSelectElement).value;
    const area = this.areas.find(a => a.soKV === soKV);
    
    if (area) {
      this.filteredTables = area.bans.filter(b => b.trangThaiBan === 'Trống');
      this.currentAreaSurcharge = area.phuThuKV || 0;
      this.invoiceForm.patchValue({ soBan: '' });
    } else {
      this.filteredTables = [];
      this.currentAreaSurcharge = 0;
    }
  }

  // --- LOGIC BỘ LỌC SẢN PHẨM ---
  filterByCategory(categoryName: string): void {
    this.activeCategory = categoryName;
    if (categoryName === 'Tất cả') {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p => p.tenLoaiSp && p.tenLoaiSp.includes(categoryName));
    }
  }

  onSearchProduct(event: Event): void {
    const keyword = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredProducts = this.products.filter(p => 
      p.tenSp.toLowerCase().includes(keyword) && 
      (this.activeCategory === 'Tất cả' || (p.tenLoaiSp && p.tenLoaiSp.includes(this.activeCategory)))
    );
  }

  // --- LOGIC GIỎ HÀNG ---
  addToCart(product: SanPhamVm): void {
    const existingItem = this.cart.find(item => item.product.maSp === product.maSp);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.cart.push({ product, quantity: 1, giamGia: 0 });
    }
  }

  increaseQty(item: CartItem): void { item.quantity++; }
  decreaseQty(item: CartItem): void {
    if (item.quantity > 1) item.quantity--;
    else this.removeFromCart(item);
  }
  removeFromCart(item: CartItem): void {
    const index = this.cart.indexOf(item);
    if (index > -1) this.cart.splice(index, 1);
  }

  get subTotal(): number {
    return this.cart.reduce((sum, item) => sum + (item.product.giaSp * item.quantity), 0);
  }
  get vatAmount(): number { return this.subTotal * 0.1; }
  get totalAmount(): number {
    const giamGia = this.invoiceForm.get('giamGiaHD')?.value || 0;
    return this.subTotal + this.vatAmount + this.currentAreaSurcharge - Number(giamGia);
  }

  // ================= LUỒNG XỬ LÝ KHÁCH HÀNG TỰ ĐỘNG BẰNG FRONTEND RXJS =================
  onSubmit(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      alert('Vui lòng chọn Khu vực và Bàn đầy đủ trước khi chuyển nhà bếp!'); 
      return;
    }

    if (this.cart.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm vào giỏ hàng!'); 
      return;
    }

    this.isSubmitting = true;
    const formValues = this.invoiceForm.getRawValue();
    const sdtNhap = formValues.sdtKH ? formValues.sdtKH.trim() : '';

    let luongXuLyKhachHang$: Observable<any>;

    // TRƯỜNG HỢP 1: Có mã khách hàng cũ đã gán từ danh sách live
    if (formValues.maKH) {
      luongXuLyKhachHang$ = of({ success: true, data: { maKH: formValues.maKH } });
    } 
    // TRƯỜNG HỢP 2 & 3: Chưa có mã (SĐT mới tinh hoặc Input để rỗng) -> Ép FE gọi POST tạo khách hàng mới
    else {
      const payloadKhachMoi = {
        tenKH: 'Khách vãng lai',
        sdtkh: sdtNhap || null, // Nếu rỗng chuyển hẳn thành null theo quy chuẩn DB của bạn
        diemTichLuy: 0,
        ghiChuKH: 'Tự động khởi tạo từ quầy thu ngân'
      };

      // Gọi hàm create có sẵn trong KhachHangService (Bắn đến POST /api/KhachHangs)
      luongXuLyKhachHang$ = this.khachHangService.create(payloadKhachMoi);
    }

    // 🚀 CHUỖI PIPELINE KHÉP KÍN: Đảm bảo có maKH rồi mới bắn tiếp lệnh tạo hóa đơn
    luongXuLyKhachHang$.pipe(
      switchMap((resKhach) => {
        // Trích xuất lấy mã khách hàng trả về từ cấu trúc ApiResponse của Server của bạn
        const maKhachHangChuan = resKhach?.success ? resKhach.data.maKH : resKhach?.maKH;
        
        if (!maKhachHangChuan) {
          throw new Error('Hệ thống không thể định danh hoặc khởi tạo mã Khách hàng mới.');
        }

        // Cấu trúc Payload hóa đơn sạch hoàn chỉnh gửi đi
        const payloadHoaDon = {
          maKH: maKhachHangChuan, 
          soBan: formValues.soBan,
          maNV_PV: this.currentUser.maNV, 
          maNV_PC: null,
          giamGiaHD: Number(formValues.giamGiaHD) || 0,
          phuThu: this.currentAreaSurcharge, 
          thueVAT: this.vatAmount,
          trangThaiHD: "Chờ pha chế", 
          ghiChuHD: formValues.ghiChuHD,
          chiTietHoaDons: this.cart.map(item => ({
            maSP: item.product.maSp,
            slsp: item.quantity,
            donGia: item.product.giaSp,
            giamGia: item.giamGia
          }))
        };

        return this.hoaDonService.create(payloadHoaDon);
      })
    ).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Tạo hóa đơn thành công! Đã chuyển thông tin Order xuống quầy Pha chế.');
          this.router.navigate(['/admin/hoa-don']);
        } else {
          alert(res.message || 'Lỗi lưu dữ liệu hóa đơn.');
          this.isSubmitting = false;
        }
      },
      error: (err) => {
        console.error('Lỗi liên hoàn phân hệ bán hàng:', err);
        alert(err.error?.message || 'Có lỗi xảy ra trong quá trình tự động định danh khách hàng hoặc kết nối Somee Hosting.');
        this.isSubmitting = false;
      }
    });
  }
}