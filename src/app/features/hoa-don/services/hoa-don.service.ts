import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  statusCode: number;
}

export interface CTHDVm {
  soCTHD: string;
  maSP: string;
  slsp: number;
  donGia: number;
  giamGia: number;
  thanhTien: number;
}

export interface HoaDonVm {
  soHD: string;
  maKH: string;
  soBan: string;
  maNV_PV: string;
  maNV_PC: string;
  tgVao: string;
  tgRa?: string;
  giamGiaHD: number;
  phuThu: number;
  thueVAT: number;
  tongTien: number;
  trangThaiHD: string;
  ghiChuHD: string;
  chiTietHoaDons: CTHDVm[];
}

@Injectable({
  providedIn: 'root'
})
export class HoaDonService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/HoaDons`;

  getAll(): Observable<ApiResponse<HoaDonVm[]>> {
    return this.http.get<ApiResponse<HoaDonVm[]>>(this.apiUrl);
  }

  getById(soHD: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${soHD}`);
  }

  create(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, data);
  }

  update(soHd: string, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${soHd}`, data);
  }

  // Cập nhật trạng thái hóa đơn
  updateStatus(soHD: string, newStatus: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${soHD}/status`, `"${newStatus}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}