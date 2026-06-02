import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

export interface KhuyenMaiVm {
  maKM: string;
  tenKM: string;
  loaiKM: string; 
  giaTriKM: number;
  ngayBD: string;
  ngayKT: string;
  dieuKienKM?: string;
  ghiChuKM?: string;
  _runtimeStatus?: string; 
}

@Injectable({
  providedIn: 'root'
})
export class KhuyenMaiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/KhuyenMais`;

  getAll(): Observable<any> { return this.http.get<any>(this.apiUrl); }
  getById(id: string): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }

  // 1. Tạo Khuyến mãi mới
  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // 2. Gán danh sách sản phẩm vào KM
  ganSanPham(maKM: string, maSanPhams: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${maKM}/san-phams`, { maSanPhams });
  }

  // 3. Xóa Khuyến mãi (Sử dụng để Rollback nếu lỗi gán)
  delete(maKM: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${maKM}`);
  }

  endEarly(id: string, currentData: KhuyenMaiVm): Observable<any> {
    const payload = { ...currentData, ngayKT: new Date().toISOString() };
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }
  // Cập nhật thông tin Khuyến mãi
  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  // Lấy danh sách sản phẩm thuộc Khuyến mãi (Kèm giá đã giảm)
  getSanPhams(maKM: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${maKM}/san-phams`);
  }

  // Gỡ 1 sản phẩm khỏi Khuyến mãi
  xoaSanPham(maKM: string, maSP: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${maKM}/san-phams/${maSP}`);
  }
}