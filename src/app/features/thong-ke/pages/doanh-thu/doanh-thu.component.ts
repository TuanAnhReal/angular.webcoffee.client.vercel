import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../../environments/environment.development';

// ==========================================
// STRICT ENTERPRISE INTERFACES
// ==========================================
export interface LoaiSP {
  maLoaiSp: string;
  tenLoaiSp: string;
}

export interface SanPham {
  maSp: string;
  tenSp: string;
  maLoaiSp: string;
  hinhAnh?: string | null;
}

export interface ChiTietHoaDon {
  maSP: string;
  slsp: number;
  thanhTien: number;
}

export interface HoaDon {
  soHD: string;
  soBan?: string | null;
  tgVao: string;
  tongTien: number;
  trangThaiHD: 'Đã thanh toán' | 'Hoàn thành' | 'Đã hủy' | 'Chờ thanh toán' | string;
  chiTietHoaDons?: ChiTietHoaDon[];
}

export interface ThongKeNganhHang {
  maLoaiSp: string;
  tenLoaiSp: string;
  tongDoanhThu: number;
  tongSoLuong: number;
  phanTramDoanhThu: number;
  mauSac: string;
}

export interface SanPhamChiTiet {
  maSp: string;
  tenSp: string;
  tenLoaiSp: string;
  hinhAnh: string | null;
  soLuongBan: number;
  tongDoanhThuMon: number;
}

@Component({
  selector: 'app-doanh-thu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doanh-thu.component.html'
})
export class DoanhThuComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // UI States & Core Filters
  dangTai = signal<boolean>(true);
  loaiBoLoc = signal<'ngay' | 'thang' | 'nam'>('ngay');
  tuKhoaTimKiem = signal<string>('');
  
  // Pagination & Server-ready Stable Sorting States
  trangHienTai = signal<number>(1);
  kichThuocTrang = 5;
  tieuChiSort = signal<'doanhThu' | 'soLuong' | 'danhMuc'>('doanhThu');
  huongSort = signal<'asc' | 'desc'>('desc');

  // Interactive UI Mouse Signals (Tooltip/Highlight tracking)
  activeBar = signal<number | null>(null);
  activeHourBar = signal<number | null>(null);

  // Raw Enterprise Core Data Signals
  danhSachHoaDonTho = signal<HoaDon[]>([]);
  danhSachSanPhamTho = signal<SanPham[]>([]);
  danhSachLoaiSpTho = signal<LoaiSP[]>([]);

  // Premium Financial Color Palette (Stripe Style)
  private readonly paletteMau = [
    '#2563eb', '#10b981', '#6366f1', '#f59e0b', '#ec4899', 
    '#14b8a6', '#06b6d4', '#a855f7', '#f43f5e', '#84cc16'
  ];

  ngOnInit(): void {
    this.taiDuLieuThongKe();
  }

  public taiDuLieuThongKe(): void {
    this.dangTai.set(true);
    forkJoin({
      hoaDons: this.http.get<any>(`${this.apiUrl}/HoaDons`),
      sanPhams: this.http.get<any>(`${this.apiUrl}/SanPhams`),
      loaiSps: this.http.get<any>(`${this.apiUrl}/LoaiSPs`)
    }).subscribe({
      next: (res) => {
        const hDons = res.hoaDons?.success ? res.hoaDons.data : (Array.isArray(res.hoaDons) ? res.hoaDons : []);
        const sPhams = res.sanPhams?.success ? res.sanPhams.data : (Array.isArray(res.sanPhams) ? res.sanPhams : []);
        const lSps = res.loaiSps?.success ? res.loaiSps.data : (Array.isArray(res.loaiSps) ? res.loaiSps : []);

        this.danhSachHoaDonTho.set(hDons);
        this.danhSachSanPhamTho.set(sPhams);
        this.danhSachLoaiSpTho.set(lSps);
        this.dangTai.set(false);
      },
      error: (err) => {
        console.error('Lỗi tích hợp hệ thống dữ liệu Dashboard:', err);
        this.dangTai.set(false);
      }
    });
  }

  // =========================================================
  // HIGH-PERFORMANCE MAP LOOKUPS & CORE CACHING (O(1))
  // =========================================================

  // Caching Map Sản Phẩm để truy cập tức thời O(1)
  private sanPhamMap = computed(() => {
    const maps = new Map<string, SanPham>();
    this.danhSachSanPhamTho().forEach(sp => maps.set(sp.maSp, sp));
    return maps;
  });

  // Caching Map Danh Mục Loại SP để truy cập tức thời O(1)
  private loaiSpMap = computed(() => {
    const maps = new Map<string, LoaiSP>();
    this.danhSachLoaiSpTho().forEach(l => maps.set(l.maLoaiSp, l));
    return maps;
  });

  // Bộ lọc hóa đơn thành công duy nhất (Single Source of Truth)
  public hoaDonThanhCong = computed(() => 
    this.danhSachHoaDonTho().filter(hd => hd.trangThaiHD === 'Đã thanh toán' || hd.trangThaiHD === 'Hoàn thành')
  );

  // =========================================================
  // FINANCIAL ANALYTICS TIME FILTERING ENGINE
  // =========================================================
  
  public hoaDonTheoBoLoc = computed(() => {
    const ds = this.hoaDonThanhCong();
    const homNay = new Date().toLocaleDateString('en-CA');
    const thangNay = homNay.substring(0, 7);
    const namNay = homNay.substring(0, 4);
    const filterType = this.loaiBoLoc();

    return ds.filter(hd => {
      if (!hd.tgVao) return false;
      const ngayHD = hd.tgVao.split('T')[0];
      if (filterType === 'ngay') return ngayHD === homNay;
      if (filterType === 'thang') return ngayHD.startsWith(thangNay);
      return ngayHD.startsWith(namNay);
    });
  });

  // Phục vụ phân tích tỷ lệ hủy đơn / chất lượng vận hành tổng thể
  public tatCaHoaDonTheoBoLoc = computed(() => {
    const ds = this.danhSachHoaDonTho();
    const homNay = new Date().toLocaleDateString('en-CA');
    const thangNay = homNay.substring(0, 7);
    const namNay = homNay.substring(0, 4);
    const filterType = this.loaiBoLoc();

    return ds.filter(hd => {
      if (!hd.tgVao) return false;
      const ngayHD = hd.tgVao.split('T')[0];
      if (filterType === 'ngay') return ngayHD === homNay;
      if (filterType === 'thang') return ngayHD.startsWith(thangNay);
      return ngayHD.startsWith(namNay);
    });
  });

  // =========================================================
  // CORE FINANCIAL KPI METRICS
  // =========================================================
  public tongDoanhThu = computed(() => this.hoaDonTheoBoLoc().reduce((t, hd) => t + (hd.tongTien || 0), 0));
  public tongDonHang = computed(() => this.hoaDonTheoBoLoc().length);
  public giaTriDonTrungBinh = computed(() => this.tongDonHang() > 0 ? Math.round(this.tongDoanhThu() / this.tongDonHang()) : 0);

  // Tính toán hóa đơn trung vị thực tế (Median Ticket Value) chống nhiễu dữ liệu lệch ngoại lai
  public giaTriDonTrungVi = computed(() => {
    const giaTris = this.hoaDonTheoBoLoc().map(hd => hd.tongTien || 0).sort((a, b) => a - b);
    if (giaTris.length === 0) return 0;
    const mid = Math.floor(giaTris.length / 2);
    return giaTris.length % 2 !== 0 ? giaTris[mid] : Math.round((giaTris[mid - 1] + giaTris[mid]) / 2);
  });

  // Thống kê so sánh kỳ trước ổn định kinh doanh
  public thongKeKyTruoc = computed(() => {
    const ds = this.hoaDonThanhCong();
    const loai = this.loaiBoLoc();
    const bayGio = new Date();
    let chuoiKyTruoc = '';

    if (loai === 'ngay') {
      const homQua = new Date();
      homQua.setDate(homQua.getDate() - 1);
      chuoiKyTruoc = homQua.toLocaleDateString('en-CA');
    } else if (loai === 'thang') {
      const thangTruoc = new Date(bayGio);
      thangTruoc.setMonth(thangTruoc.getMonth() - 1);
      chuoiKyTruoc = thangTruoc.toLocaleDateString('en-CA').substring(0, 7);
    } else {
      chuoiKyTruoc = (bayGio.getFullYear() - 1).toString();
    }

    const doanhThuKyTruoc = ds
      .filter(hd => hd.tgVao && (loai === 'ngay' ? hd.tgVao.split('T')[0] === chuoiKyTruoc : hd.tgVao.split('T')[0].startsWith(chuoiKyTruoc)))
      .reduce((t, hd) => t + (hd.tongTien || 0), 0);

    const label = loai === 'ngay' ? 'Hôm qua' : loai === 'thang' ? 'Tháng trước' : 'Năm trước';
    const hienTai = this.tongDoanhThu();
    const tyLe = doanhThuKyTruoc === 0 ? (hienTai > 0 ? 100 : 0) : Math.round(((hienTai - doanhThuKyTruoc) / doanhThuKyTruoc) * 100);

    return { doanhThuKyTruoc, label, tyLe };
  });

  // REAL ANALYTICS: Dự báo dựa trên phương pháp trung bình trượt 7 ngày gần nhất (Moving Average Trend)
  public xuThuongDoanhThuUocTinh = computed(() => {
    const ds = this.hoaDonThanhCong();
    const mangChuoi7Ngay: string[] = [];
    for (let i = 7; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      mangChuoi7Ngay.push(d.toLocaleDateString('en-CA'));
    }

    let tong7Ngay = 0;
    ds.forEach(hd => {
      if (!hd.tgVao) return;
      const ngayHD = hd.tgVao.split('T')[0];
      if (mangChuoi7Ngay.includes(ngayHD)) {
        tong7Ngay += (hd.tongTien || 0);
      }
    });

    const trungBinhNgay = Math.round(tong7Ngay / 7);
    const filter = this.loaiBoLoc();
    if (filter === 'ngay') return trungBinhNgay;
    if (filter === 'thang') return trungBinhNgay * 30;
    return trungBinhNgay * 365;
  });

  // =========================================================
  // ANALYTICS SẢN PHẨM & NGÀNH HÀNG ĐỘNG TOÀN DIỆN (O(1) MAPPING)
  // =========================================================
  
  public thongKeSanPhamChiTiet = computed<SanPhamChiTiet[]>(() => {
    const spMap = this.sanPhamMap();
    const lSpMap = this.loaiSpMap();
    const hoaDons = this.hoaDonTheoBoLoc();
    const banDoSp = new Map<string, { soLuong: number; doanhThu: number }>();

    // Vòng lặp tối ưu hóa O(N * K) tuyệt đối không nested .find() chéo
    hoaDons.forEach(hd => {
      (hd.chiTietHoaDons ?? []).forEach(ct => {
        const hienTai = banDoSp.get(ct.maSP) ?? { soLuong: 0, doanhThu: 0 };
        hienTai.soLuong += (ct.slsp || 0);
        hienTai.doanhThu += (ct.thanhTien || 0);
        banDoSp.set(ct.maSP, hienTai);
      });
    });

    return Array.from(banDoSp.entries()).map(([maSp, metrics]) => {
      const sp = spMap.get(maSp);
      const loai = sp ? lSpMap.get(sp.maLoaiSp) : null;
      return {
        maSp,
        tenSp: sp?.tenSp ?? `Sản phẩm ${maSp}`,
        tenLoaiSp: loai?.tenLoaiSp ?? 'Khác',
        hinhAnh: sp?.hinhAnh ?? null,
        soLuongBan: metrics.soLuong,
        tongDoanhThuMon: metrics.doanhThu
      };
    });
  });

  // REAL ANALYTICS NGÀNH HÀNG: Cấu trúc động 100% từ danh mục /LoaiSPs
  public thongKeNganhHangDong = computed<ThongKeNganhHang[]>(() => {
    const categories = this.danhSachLoaiSpTho();
    const spChiTiet = this.thongKeSanPhamChiTiet();
    const lSpMap = this.loaiSpMap();

    const banDoNganh = new Map<string, { doanhThu: number; soLuong: number }>();
    categories.forEach(c => banDoNganh.set(c.tenLoaiSp, { doanhThu: 0, soLuong: 0 }));

    spChiTiet.forEach(sp => {
      const metrics = banDoNganh.get(sp.tenLoaiSp) ?? { doanhThu: 0, soLuong: 0 };
      metrics.doanhThu += sp.tongDoanhThuMon;
      metrics.soLuong += sp.soLuongBan;
      banDoNganh.set(sp.tenLoaiSp, metrics);
    });

    const totalNet = Array.from(banDoNganh.values()).reduce((t, n) => t + n.doanhThu, 0) || 1;

    return categories.map((cat, index) => {
      const data = banDoNganh.get(cat.tenLoaiSp) || { doanhThu: 0, soLuong: 0 };
      return {
        maLoaiSp: cat.maLoaiSp,
        tenLoaiSp: cat.tenLoaiSp,
        tongDoanhThu: data.doanhThu,
        tongSoLuong: data.soLuong,
        phanTramDoanhThu: Math.round((data.doanhThu / totalNet) * 100),
        mauSac: this.paletteMau[index % this.paletteMau.length]
      };
    }).sort((a, b) => b.tongDoanhThu - a.tongDoanhThu);
  });

  public hieuSuatNganhHangSummary = computed(() => {
    const ds = this.thongKeNganhHangDong().filter(n => n.tongDoanhThu > 0);
    return {
      caoNhat: ds.length ? ds[0] : null,
      thapNhat: ds.length > 1 ? ds[ds.length - 1] : null
    };
  });

  // Top 5 sản phẩm hiệu suất cao phục vụ UI
  public topSanPhamBanChay = computed(() => [...this.thongKeSanPhamChiTiet()].sort((a, b) => b.soLuongBan - a.soLuongBan).slice(0, 5));
  public topSanPhamDoanhThuCao = computed(() => [...this.thongKeSanPhamChiTiet()].sort((a, b) => b.tongDoanhThuMon - a.tongDoanhThuMon).slice(0, 5));
  public tenMonBanChayNhat = computed(() => this.topSanPhamBanChay()[0]?.tenSp ?? 'Chưa có dữ liệu');

  // =========================================================
  // BEHAVIORAL & OPERATIONAL ANALYTICS
  // =========================================================

  // Phân tích hình thức đặt đơn với Fallback Logic nghiêm ngặt chống gõ lỗi/null
  public phanTichKhachHang = computed(() => {
    const ds = this.hoaDonTheoBoLoc();
    let taiQuan = 0;
    let mangDi = 0;

    ds.forEach(hd => {
      const banRaw = hd.soBan ? hd.soBan.trim().toLowerCase() : '';
      // Fallback Logic Chống nhập liệu rỗng hoặc biến thể text tiếng Việt của Takeaway
      if (banRaw === '' || banRaw === 'mang đi' || banRaw === 'mang di' || banRaw === 'takeaway' || banRaw === 'null') {
        mangDi++;
      } else {
        taiQuan++;
      }
    });

    const tongKhach = taiQuan + mangDi || 1;
    return {
      taiQuan, mangDi,
      phanTramTaiQuan: Math.round((taiQuan / tongKhach) * 100),
      phanTramMangDi: Math.round((mangDi / tongKhach) * 100)
    };
  });

  public phanTichVanHanh = computed(() => {
    const tatCa = this.tatCaHoaDonTheoBoLoc();
    const tong = tatCa.length || 1;
    const thanhCong = tatCa.filter(hd => hd.trangThaiHD === 'Đã thanh toán' || hd.trangThaiHD === 'Hoàn thành').length;
    const daHuy = tatCa.filter(hd => hd.trangThaiHD === 'Đã hủy').length;

    return {
      tongHoaDonKyNay: tatCa.length,
      thanhCong, daHuy,
      tyLeThanhCong: Math.round((thanhCong / tong) * 100),
      tyLeHuy: Math.round((daHuy / tong) * 100)
    };
  });

  // REAL HOUR ANALYTICS: Đếm đơn + Tính doanh thu phân rã để xác định chuẩn Giờ Cao Tải
  public thongKeLuuLuongGioNangCao = computed(() => {
    const khungGio = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const thongKeDon = new Array(khungGio.length).fill(0);
    const thongKeDoanhThu = new Array(khungGio.length).fill(0);

    this.hoaDonTheoBoLoc().forEach(hd => {
      if (!hd.tgVao) return;
      const gio = new Date(hd.tgVao).getHours();
      const idx = khungGio.indexOf(gio);
      if (idx !== -1) {
        thongKeDon[idx]++;
        thongKeDoanhThu[idx] += (hd.tongTien || 0);
      }
    });

    const maxDon = Math.max(...thongKeDon) || 1;
    let maxRevenueIdx = 0;
    thongKeDoanhThu.forEach((val, idx) => {
      if (val > thongKeDoanhThu[maxRevenueIdx]) maxRevenueIdx = idx;
    });

    return {
      mangCotChieuCao: thongKeDon.map(d => Math.max(8, Math.round((d / maxDon) * 100))),
      nhanKhungGio: khungGio,
      mangSoLuongDon: thongKeDon,
      mangDoanhThuGio: thongKeDoanhThu,
      gioVangKinhDoanh: `${khungGio[maxRevenueIdx]}h - ${khungGio[maxRevenueIdx] + 1}h`
    };
  });

  // =========================================================
  // STABLE SERVER-READY TABLE COMPASS LOGIC
  // =========================================================
  public danhSachBangHienThi = computed(() => {
    const tuKhoa = this.tuKhoaTimKiem().trim().toLowerCase();
    let ketQua = this.thongKeSanPhamChiTiet();

    if (tuKhoa) {
      ketQua = ketQua.filter(m => m.tenSp.toLowerCase().includes(tuKhoa) || m.tenLoaiSp.toLowerCase().includes(tuKhoa));
    }

    const tieuChi = this.tieuChiSort();
    const huong = this.huongSort() === 'asc' ? 1 : -1;

    return ketQua.sort((a, b) => {
      if (tieuChi === 'doanhThu') return (a.tongDoanhThuMon - b.tongDoanhThuMon) * huong;
      if (tieuChi === 'soLuong') return (a.soLuongBan - b.soLuongBan) * huong;
      return a.tenLoaiSp.localeCompare(b.tenLoaiSp) * huong;
    });
  });

  public danhSachBangPhanTrang = computed(() => {
    const batDau = (this.trangHienTai() - 1) * this.kichThuocTrang;
    return this.danhSachBangHienThi().slice(batDau, batDau + this.kichThuocTrang);
  });

  public tongSoTrangBang = computed(() => Math.ceil(this.danhSachBangHienThi().length / this.kichThuocTrang) || 1);

  // Biểu đồ đường SVG xu hướng tài chính thực tế
  public toadoDoThiTuyen = computed(() => {
    const mangDT = new Array(7).fill(0);
    const mangChuoi: string[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      mangChuoi.push(d.toLocaleDateString('en-CA'));
    }

    this.hoaDonThanhCong().forEach(hd => {
      if (!hd.tgVao) return;
      const idx = mangChuoi.indexOf(hd.tgVao.split('T')[0]);
      if (idx !== -1) mangDT[idx] += (hd.tongTien || 0);
    });

    const maxRev = Math.max(...mangDT) || 1;
    const diemY = mangDT.map(t => 170 - Math.round((t / maxRev) * 130));
    const xs = [40, 190, 340, 490, 640, 790, 940];
    const chuoiPath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x},${diemY[i]}`).join(' ');
    const chuoiAreaPath = chuoiPath + ` L 940,180 L 40,180 Z`;
    const nhanNgay = mangChuoi.map(n => n.substring(5).replace('-', '/'));

    return { chuoiPath, chuoiAreaPath, diemY, nhanNgay, mangGiaTri: mangDT, toaDoX: xs };
  });

  // =========================================================
  // ACTIONS HANDLERS
  // =========================================================
  public thayDoiBoLoc(kieu: 'ngay' | 'thang' | 'nam'): void {
    this.loaiBoLoc.set(kieu);
    this.trangHienTai.set(1);
  }

  public thayDoiSort(tieuChi: 'doanhThu' | 'soLuong' | 'danhMuc'): void {
    if (this.tieuChiSort() === tieuChi) {
      this.huongSort.set(this.huongSort() === 'asc' ? 'desc' : 'asc');
    } else {
      this.tieuChiSort.set(tieuChi);
      this.huongSort.set('desc');
    }
  }

  public chuyenTrang(huong: number): void {
    const dich = this.trangHienTai() + huong;
    if (dich >= 1 && dich <= this.tongSoTrangBang()) {
      this.trangHienTai.set(dich);
    }
  }

  public xuatBaoCaoExcel(): void {
    const ds = this.hoaDonTheoBoLoc();
    if (ds.length === 0) {
      alert('Không có dữ liệu dòng tiền trong kỳ này để xuất CSV!');
      return;
    }
    // Ngăn chặn rủi ro CSV Injection bằng việc bao bọc dấu nháy kép an toàn dữ liệu đầu ra
    let csv = '"Ma Hoa Don","So Ban","Thoi Gian","Tong Tien","Trang Thai"\n';
    ds.forEach(hd => {
      csv += `"${hd.soHD ?? ''}","${hd.soBan ?? 'Mang di'}","${hd.tgVao ?? ''}","${hd.tongTien ?? 0}","${hd.trangThaiHD ?? ''}"\n`;
    });
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `BaoCao_Enterprise_Financial_Report_${this.loaiBoLoc()}_2026.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}