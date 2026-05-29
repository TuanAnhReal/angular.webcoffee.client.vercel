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

export interface LoaiSPVm {
    maLoaiSp: string;
    tenLoaiSp: string;
    laHangDeVo: boolean; 
    baoQuan: string;  
    ghiChuLoaiSP: string;
}

export interface SanPhamVm {
    maSp: string;
    tenSp: string;
    giaSp: number;
    giaVon?: number;
    dvt?: string;
    moTa?: string;
    trangThai?: string;
    maLoaiSp?: string;
    tenLoaiSp: string;
    hinhAnh?: string;
    kichThuoc?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SanPhamService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/SanPhams`;
    private loaiSpUrl = `${environment.apiUrl}/LoaiSPs`;

    getAll(): Observable<ApiResponse<SanPhamVm[]>> {
        return this.http.get<ApiResponse<SanPhamVm[]>>(this.apiUrl);
    }

    getLoaiSps(): Observable<ApiResponse<LoaiSPVm[]>> {
        return this.http.get<ApiResponse<LoaiSPVm[]>>(this.loaiSpUrl);
    }

    create(formData: FormData): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(this.apiUrl, formData);
    }

    update(maSp: string, formData: FormData): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${maSp}`, formData);
    }

    delete(maSp: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${maSp}`);
    }
    getById(maSp: string): Observable<ApiResponse<SanPhamVm>> {
        return this.http.get<ApiResponse<SanPhamVm>>(`${this.apiUrl}/${maSp}`);
    }
  createCategory(data: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(this.loaiSpUrl, data);
  }

  updateCategory(id: string, data: any): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.loaiSpUrl}/${id}`, data);
  }

  deleteCategory(id: string | undefined): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.loaiSpUrl}/${id}`);
  }
}