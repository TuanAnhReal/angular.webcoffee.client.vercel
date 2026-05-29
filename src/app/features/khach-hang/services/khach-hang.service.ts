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

export interface KhachHangVm {
  maKH: string;
  tenKH: string;
  sdtkh: string;
  diemTichLuy: number;
  ngayTao: string;
  ghiChuKH?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KhachHangService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/KhachHangs`;

  getAll(): Observable<ApiResponse<KhachHangVm[]>> {
    return this.http.get<ApiResponse<KhachHangVm[]>>(this.apiUrl);
  }

  getById(maKh: string): Observable<ApiResponse<KhachHangVm>> {
    return this.http.get<ApiResponse<KhachHangVm>>(`${this.apiUrl}/${maKh}`);
  }
  create(data: any): Observable<ApiResponse<KhachHangVm>> {
    return this.http.post<ApiResponse<KhachHangVm>>(this.apiUrl, data);
  }
  update(maKh: string, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${maKh}`, data);
  }
  delete(maKh: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${maKh}`);
  }
}