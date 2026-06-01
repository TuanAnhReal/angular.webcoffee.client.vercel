import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { switchMap, debounceTime, distinctUntilChanged, takeUntil, catchError } from 'rxjs/operators';

// Services
import { HoaDonService } from '../../services/hoa-don.service';
import { SanPhamService, SanPhamVm } from '../../../san-pham/services/san-pham.service';
import { KhachHangService, KhachHangVm } from '../../../khach-hang/services/khach-hang.service';
import { KhuVucBanService, KhuVucVm, BanVm } from '../../../khuvuc-ban/services/khu-vuc-ban.service';

// Shared Components (Tạo ở phần trước)
import { PromoBadgeComponent } from '../../../../shared/components/promo-badge/promo-badge.component';
import { PromoPriceComponent } from '../../../../shared/components/promo-price/promo-price.component';

export interface CartItem {
  product: SanPhamVm;
  quantity: number;
}

@Component({
  selector: 'app-hoa-don-create',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PromoBadgeComponent, PromoPriceComponent],
  templateUrl: './hoa-don-create.component.html'
})
export class HoaDonCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private hoaDonService = inject(HoaDonService);
  private sanPhamService = inject(SanPhamService);
  private khachHangService = inject(KhachHangService);
  private khuVucBanService = inject(KhuVucBanService);
  private router = inject(Router);

  invoiceForm!: FormGroup;
  private destroy$ = new Subject<void>();
  private phoneSearch$ = new Subject<string>();

  // Dữ liệu Master
  categories: any[] = [];
  products: SanPhamVm[] = [];
  filteredProducts: SanPhamVm[] = [];
  customers: KhachHangVm[] = [];
  areas: KhuVucVm[] = [];
  filteredTables: BanVm[] = [];

  // Trạng thái hệ thống
  cart: CartItem[] = [];
  isLoading = true;
  isSubmitting = false;
  activeCategory = 'Tất cả';
  apiError = false;

  // Quản lý Khách Hàng
  customerState: 'GUEST' | 'EXISTING' | 'NEW' = 'GUEST';
  matchedCustomer: KhachHangVm | null = null;

  // Info hiển thị
  currentAreaSurcharge = 0;
  currentUser: any = null;

  // Custom Toast State
  toast = { show: false, message: '', type: 'success' as 'success' | 'error' | 'warning' };

  ngOnInit(): void {
    this.initForm();
    this.loadCurrentUser();
    this.loadMasterData();
    this.setupPhoneSearch();
    this.setupOrderTypeListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Lấy dữ liệu NV từ JWT / AuthService (Giả lập)
  loadCurrentUser(): void {
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    } else {
      // Fallback
      this.currentUser = { maNV: 'NV01', hoTen: 'Nguyễn Thu Ngân', role: 'Nhân viên Phục vụ', caLam: 'Ca Sáng' };
    }
  }

  initForm(): void {
    this.invoiceForm = this.fb.group({
      hinhThuc: ['TAI_QUAN'], // TAI_QUAN hoặc MANG_VE
      sdtKH: [''],
      tenKHMoi: [''], // Dành cho khách mới
      soKV: ['', Validators.required],
      soBan: ['', Validators.required],
      giamGiaHD: [0, Validators.min(0)],
      ghiChuHD: ['']
    });
  }

  // Bắt sự kiện đổi hình thức MANG VỀ / TẠI QUÁN
  setupOrderTypeListener(): void {
    this.invoiceForm.get('hinhThuc')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(type => {
      if (type === 'MANG_VE') {
        this.invoiceForm.patchValue({ soKV: '', soBan: 'Mang đi' });
        this.invoiceForm.get('soKV')?.clearValidators();
        this.invoiceForm.get('soBan')?.clearValidators();
        this.currentAreaSurcharge = 0;
        this.filteredTables = [];
      } else {
        this.invoiceForm.patchValue({ soKV: '', soBan: '' });
        this.invoiceForm.get('soKV')?.setValidators(Validators.required);
        this.invoiceForm.get('soBan')?.setValidators(Validators.required);
      }
      this.invoiceForm.get('soKV')?.updateValueAndValidity();
      this.invoiceForm.get('soBan')?.updateValueAndValidity();
    });
  }

  // Tải đồng loạt API - Fix triệt để bug Loading
  loadMasterData(): void {
    this.isLoading = true;
    this.apiError = false;

    forkJoin({
      products: this.sanPhamService.getAll(),
      categories: this.sanPhamService.getLoaiSps(), // API Load Danh mục động
      customers: this.khachHangService.getAll(),
      areas: this.khuVucBanService.getAllNested()
    }).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.apiError = true;
        return of(null); // Bắt lỗi để không sập luồng
      })
    ).subscribe((results: any) => {
      if (results) {
        if (results.products?.success) {
          this.products = results.products.data.filter((p: any) => p.trangThai === 'Đang bán');
          this.filteredProducts = this.products;
        }
        if (results.categories?.success) this.categories = results.categories.data;
        if (results.customers?.success) this.customers = results.customers.data;
        if (results.areas?.success) this.areas = results.areas.data;
      }

      this.isLoading = false;
      this.cdr.detectChanges(); // ÉP RENDER NGAY LẬP TỨC
    });
  }

  // ================= QUẢN LÝ KHÁCH HÀNG (THÔNG MINH) =================
  setupPhoneSearch(): void {
    this.phoneSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(phone => {
      const cleanPhone = phone.replace(/[\s\-\.]/g, '');

      if (!cleanPhone) {
        this.customerState = 'GUEST';
        this.matchedCustomer = null;
        this.invoiceForm.patchValue({ tenKHMoi: '' });
        return;
      }

      this.matchedCustomer = this.customers.find(c => c.sdtkh && c.sdtkh.replace(/[\s\-\.]/g, '') === cleanPhone) || null;

      if (this.matchedCustomer) {
        this.customerState = 'EXISTING';
        this.invoiceForm.patchValue({ tenKHMoi: '' });
      } else {
        this.customerState = 'NEW';
      }
      this.cdr.detectChanges();
    });
  }

  onPhoneChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.phoneSearch$.next(val);
  }

  // ================= LOGIC MENU & GIỎ HÀNG =================
  filterByCategory(maLoai: string): void {
    this.activeCategory = maLoai;
    if (maLoai === 'Tất cả') {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p => p.maLoaiSp === maLoai);
    }
  }

  onSearchProduct(event: Event): void {
    const keyword = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredProducts = this.products.filter(p =>
      p.tenSp.toLowerCase().includes(keyword) &&
      (this.activeCategory === 'Tất cả' || p.maLoaiSp === this.activeCategory)
    );
  }

  onAreaChange(event: Event): void {
    const soKV = (event.target as HTMLSelectElement).value;
    const area = this.areas.find(a => a.soKV === soKV);
    if (area) {
      this.filteredTables = area.bans.filter((b: any) => b.trangThaiBan === 'Trống');
      this.currentAreaSurcharge = area.phuThuKV || 0;
      this.invoiceForm.patchValue({ soBan: '' });
    } else {
      this.filteredTables = [];
      this.currentAreaSurcharge = 0;
    }
  }

  addToCart(product: SanPhamVm): void {
    const existing = this.cart.find(item => item.product.maSp === product.maSp);
    if (existing) existing.quantity++;
    else this.cart.push({ product, quantity: 1 });
  }

  increaseQty(item: CartItem): void { item.quantity++; }
  decreaseQty(item: CartItem): void {
    if (item.quantity > 1) item.quantity--;
    else this.removeFromCart(item);
  }
  removeFromCart(item: CartItem): void {
    this.cart = this.cart.filter(i => i !== item);
  }
  clearCart(): void {
    if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      this.cart = [];
    }
  }

  // ================= TOÁN HỌC KHUYẾN MÃI (CHUẨN BACKEND) =================
  get tongTienHangGoc(): number {
    return this.cart.reduce((sum, item) => sum + (item.product.giaSp * item.quantity), 0);
  }
  get tongGiamGiaSP(): number {
    return this.cart.reduce((sum, item) => {
      const giam = item.product.giaSp - (item.product.giaSauKhuyenMai || item.product.giaSp);
      return sum + (giam * item.quantity);
    }, 0);
  }
  get tongThucThu(): number {
    return this.tongTienHangGoc - this.tongGiamGiaSP;
  }
  get vatAmount(): number { return this.tongThucThu * 0.1; } // Giả sử 10%
  get totalAmount(): number {
    const voucher = this.invoiceForm.get('giamGiaHD')?.value || 0;
    return this.tongThucThu + this.vatAmount + this.currentAreaSurcharge - Number(voucher);
  }

  // ================= TOAST NOTIFICATION =================
  showToast(message: string, type: 'success' | 'error' | 'warning'): void {
    this.toast = { show: true, message, type };
    setTimeout(() => this.toast.show = false, 3500);
  }

  // ================= SUBMIT TẠO HÓA ĐƠN =================
  onSubmit(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.showToast('Vui lòng điền đầy đủ Khu vực và Bàn!', 'warning');
      return;
    }
    if (this.cart.length === 0) {
      this.showToast('Giỏ hàng đang trống!', 'warning');
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn tạo hóa đơn này?')) return;

    this.isSubmitting = true;
    const formValues = this.invoiceForm.getRawValue();
    const phone = formValues.sdtKH?.trim();

    let processCustomer$: Observable<any>;

    // 1. Logic xử lý Khách hàng
    if (this.customerState === 'EXISTING' && this.matchedCustomer) {
      processCustomer$ = of({ success: true, data: { maKH: this.matchedCustomer.maKH } });
    }
    else if (this.customerState === 'NEW' && phone) {
      const payloadKH = {
        tenKH: formValues.tenKHMoi?.trim() || 'Khách mới',
        sdtkh: phone,
        diemTichLuy: 0,
        ghiChuKH: 'Tạo tự động từ POS'
      };
      processCustomer$ = this.khachHangService.create(payloadKH);
    }
    else {
      // Khách vãng lai
      const payloadGuest = { tenKH: 'Khách vãng lai', sdtkh: null, diemTichLuy: 0, ghiChuKH: 'Order không định danh' };
      processCustomer$ = this.khachHangService.create(payloadGuest);
    }

    // 2. Chaining tạo Hóa đơn
    processCustomer$.pipe(
      switchMap(resKhach => {
        const maKH = resKhach?.data?.maKH || resKhach?.maKH;
        if (!maKH) throw new Error('Không lấy được mã Khách hàng');

        const payloadHoaDon = {
          maKH: maKH,
          soBan:
            formValues.hinhThuc === 'MANG_VE'
              ? null
              : formValues.soBan,
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
            donGia: item.product.giaSauKhuyenMai || item.product.giaSp,
            giamGia: (item.product.giaSp - (item.product.giaSauKhuyenMai || item.product.giaSp))
          }))

        }; console.log(payloadHoaDon);
        return this.hoaDonService.create(payloadHoaDon);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast('Chuyển Order xuống pha chế thành công!', 'success');
          setTimeout(() => this.router.navigate(['/admin/hoa-don']), 1000);
        } else {
          this.showToast(res.message || 'Lỗi lưu hóa đơn', 'error');
          this.isSubmitting = false;
        }
      },
      error: (err) => {
        console.error(err);
        this.showToast('Lỗi kết nối máy chủ!', 'error');
        this.isSubmitting = false;
      }
    });
  }
}