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

export interface LoaiNVVm {
  maLoaiNV: string;
  tenLoaiNV: string;
  hsLoaiNV: number;
}

export interface NhanVienVm {
  maNV: string;
  maLoaiNV: string;
  hoNV: string;
  tenNV: string;
  phaiNV: string;
  ngaySinhNV?: string;
  soDTNV?: string;
  diaChiNV_TT?: string;
  diaChiNV_NT?: string;
  soCCCD?: string;
  soTKNV?: string;
  tenNgHNV?: string;
  soBHYT?: string;
  soBHXH?: string;
  hinhAnhNV?: string;
  trinhDoHV?: string;
  ghiChuNV?: string;
  trangThaiNV: string;
}

@Injectable({
  providedIn: 'root'
})
export class NhanVienService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/NhanViens`;
  private loaiNvUrl = `${environment.apiUrl}/LoaiNVs`;

  getAll(): Observable<ApiResponse<NhanVienVm[]>> {
    return this.http.get<ApiResponse<NhanVienVm[]>>(this.apiUrl);
  }

  getLoaiNvs(): Observable<ApiResponse<LoaiNVVm[]>> {
    return this.http.get<ApiResponse<LoaiNVVm[]>>(this.loaiNvUrl);
  }

  getById(maNV: string): Observable<ApiResponse<NhanVienVm>> {
    return this.http.get<ApiResponse<NhanVienVm>>(`${this.apiUrl}/${maNV}`);
  }

  create(formData: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, formData);
  }

  update(maNV: string, formData: FormData): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${maNV}`, formData);
  }

  delete(maNV: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${maNV}`);
  }
}