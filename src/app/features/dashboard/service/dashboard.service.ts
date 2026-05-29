import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

export interface GiaoDichGanDay {
  soHD: string;
  tenKhachHang: string;
  thoiGian: string;
  tongTien: number;
  trangThai: string;
}

export interface DashboardSummary {
  doanhThuHomNay: number;
  phanTramDoanhThu: number;
  tongDonHangHomNay: number;
  phanTramDonHang: number;
  khachHangMoiHomNay: number;
  phanTramKhachHang: number;
  loiNhuanHomNay: number;
  phanTramLoiNhuan: number;
  giaoDichGanDay: GiaoDichGanDay[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Dashboard`;

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
  }
}