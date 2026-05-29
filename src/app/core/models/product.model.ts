export interface Product {
  maSp: string;
  tenSp: string;
  maLoaiSp: string;
  tenLoaiSp: string;
  giaSp: number;
  tonKho: number;
  trangThai: 'Đang bán' | 'Hết hàng' | 'Ngừng kinh doanh';
  hinhAnh: string | null;
  kichThuoc?: string;
}

export interface Category {
  maLoaiSp: string;
  tenLoaiSp: string;
  moTa: string;
  soLuongSanPham: number;
  trangThai: 'Kích hoạt' | 'Tạm khóa';
}