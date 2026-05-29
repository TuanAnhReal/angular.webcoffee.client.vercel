import { Injectable, signal, computed } from '@angular/core';
import { Product, Category } from '../models/product.model';
import { Observable, of, delay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CoffeeDataService {
  // Kho dữ liệu hạt nhân sử dụng Signals của Angular 19
  private _products = signal<Product[]>([
    { maSp: 'SP001', tenSp: 'Caramel Macchiato', maLoaiSp: 'L01', tenLoaiSp: 'Cà phê', giaSp: 55000, tonKho: 42, trangThai: 'Đang bán', hinhAnh: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=120' },
    { maSp: 'SP002', tenSp: 'Matcha Latte Latte', maLoaiSp: 'L02', tenLoaiSp: 'Trà trái cây', giaSp: 49000, tonKho: 15, trangThai: 'Đang bán', hinhAnh: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=120' },
    { maSp: 'SP003', tenSp: 'Bánh sừng bò bơ', maLoaiSp: 'L03', tenLoaiSp: 'Bánh ngọt', giaSp: 35000, tonKho: 0, trangThai: 'Hết hàng', hinhAnh: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=120' },
    { maSp: 'SP004', tenSp: 'Espresso nguyên chất', maLoaiSp: 'L01', tenLoaiSp: 'Cà phê', giaSp: 29000, tonKho: 120, trangThai: 'Đang bán', hinhAnh: null },
    { maSp: 'SP005', tenSp: 'Trà Đào Cam Sả', maLoaiSp: 'L02', tenLoaiSp: 'Trà trái cây', giaSp: 45000, tonKho: 0, trangThai: 'Ngừng kinh doanh', hinhAnh: null }
  ]);

  private _categories = signal<Category[]>([
    { maLoaiSp: 'L01', tenLoaiSp: 'Cà phê', moTa: 'Các sản phẩm hạt arabica và robusta pha máy', soLuongSanPham: 2, trangThai: 'Kích hoạt' },
    { maLoaiSp: 'L02', tenLoaiSp: 'Trà trái cây', moTa: 'Trà hoa quả nhiệt đới tươi mát giải nhiệt', soLuongSanPham: 2, trangThai: 'Kích hoạt' },
    { maLoaiSp: 'L03', tenLoaiSp: 'Bánh ngọt', moTa: 'Bánh ngọt bánh sừng bò nướng trong ngày', soLuongSanPham: 1, trangThai: 'Kích hoạt' }
  ]);

  products = this._products.asReadonly();
  categories = this._categories.asReadonly();

  // CRUD Danh Mục sản phẩm
  addCategory(cat: Omit<Category, 'soLuongSanPham'>): Observable<boolean> {
    const current = this._categories();
    this._categories.set([...current, { ...cat, soLuongSanPham: 0 }]);
    return of(true).pipe(delay(400));
  }

  updateCategory(maLoaiSp: string, updated: Partial<Category>): Observable<boolean> {
    this._categories.update(cats => cats.map(c => c.maLoaiSp === maLoaiSp ? { ...c, ...updated } : c));
    return of(true).pipe(delay(400));
  }

  deleteCategory(maLoaiSp: string): Observable<boolean> {
    this._categories.update(cats => cats.filter(c => c.maLoaiSp !== maLoaiSp));
    return of(true).pipe(delay(300));
  }

  deleteProduct(maSp: string): Observable<boolean> {
    this._products.update(prods => prods.filter(p => p.maSp !== maSp));
    return of(true).pipe(delay(200));
  }
}