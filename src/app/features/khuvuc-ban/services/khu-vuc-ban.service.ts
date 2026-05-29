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

export interface BanVm {
  soBan: string;
  soKV: string;
  tenBan: string;
  trangThaiBan: string;
  ghiChuBAN?: string;
  thoiGianDatSapToi?: string;
  tenKhachDat?: string;
}

export interface KhuVucVm {
  soKV: string;
  tenKV: string;
  tgMo?: string;
  tgDong?: string;
  trangThaiKhu: string;
  phuThuKV?: number;
  ghiChuKV?: string;
  bans: BanVm[];
}

@Injectable({
  providedIn: 'root'
})
export class KhuVucBanService {
  private http = inject(HttpClient);
  
  // Trỏ về đúng Controller Tổng Hợp vừa tạo ở Backend
  private apiUrl = `${environment.apiUrl}/KhuVucBans`; 

  // Lấy toàn bộ sơ đồ (Khu vực lồng Bàn)
  getAllNested(): Observable<ApiResponse<KhuVucVm[]>> {
    return this.http.get<ApiResponse<KhuVucVm[]>>(this.apiUrl);
  }

  // ================= KHU VỰC =================
  createKhuVuc(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/khu-vucs`, data);
  }

  updateKhuVuc(soKV: string, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/khu-vucs/${soKV}`, data);
  }

  deleteKhuVuc(soKV: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/khu-vucs/${soKV}`);
  }

  // ================= BÀN =================
  createBan(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/bans`, data);
  }

  updateBan(soBan: string, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/bans/${soBan}`, data);
  }

  deleteBan(soBan: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/bans/${soBan}`);
  }
}