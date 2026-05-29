
import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = environment.apiUrl;

  registerForm!: FormGroup;
  dangTai = false;
  danhSachQuyen = signal<any[]>([]);

  ngOnInit(): void {
    this.khoiTaoForm();
    this.taiDanhSachQuyen();
  }

  khoiTaoForm(): void {
    this.registerForm = this.fb.group({
      hoVaTen: ['', [Validators.required]],
      tenDangNhap: ['', [Validators.required, Validators.minLength(4)]],
      maNV: [''], 
      maPQ: ['', [Validators.required]], 
      matKhau: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]]
    }, { validators: this.kiemTraKhopMatKhau });
  }

  kiemTraKhopMatKhau(g: FormGroup) {
    const mk = g.get('matKhau')?.value;
    const xn = g.get('confirmPassword')?.value;
    return mk === xn ? null : { 'mauKhauKhongKhop': true };
  }

  taiDanhSachQuyen(): void {
    this.http.get<any>(`${this.apiUrl}/PhanQuyens`).subscribe({
      next: (res) => {
        this.danhSachQuyen.set(res.success ? res.data : res);
        this.cdr.detectChanges();
      }
    });
  }

 onSubmit(): void {
    // 🔍 BẪY KIỂM TRA: Nếu form không hợp lệ, ép Angular in ra chính xác ô nào đang bị lỗi
    if (this.registerForm.invalid) {
      console.warn('❌ Form Đăng ký không hợp lệ! Chi tiết các ô bị lỗi cấu trúc:');
      
      Object.keys(this.registerForm.controls).forEach(key => {
        const controlErrors = this.registerForm.get(key)?.errors;
        if (controlErrors != null) {
          console.log(`👉 Ô nhập [${key}] đang bị lỗi:`, controlErrors);
        }
      });

      // Kiểm tra thêm xem có phải lỗi do lệch 2 mật khẩu không
      if (this.registerForm.errors?.['mauKhauKhongKhop']) {
        console.log('👉 Lỗi tổng thể: Mật khẩu và Xác nhận mật khẩu không khớp với nhau!');
      }

      // Ép hiển thị viền đỏ và thông báo lỗi lên giao diện UI cho người dùng thấy
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.dangTai) return;

    this.dangTai = true;
    const giaTriForm = this.registerForm.value;
    console.log('🚀 Dữ liệu sạch chuẩn bị gửi lên Server:', giaTriForm);

    this.http.post<any>(`${this.apiUrl}/Auth/register`, giaTriForm).subscribe({
      next: () => {
        alert('Đăng ký tài khoản thành công! Quay lại trang đăng nhập.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('❌ Lỗi dội từ Server API về:', err);
        alert(err.error?.message || 'Đăng ký thất bại, tên đăng nhập đã tồn tại hoặc lỗi cơ sở dữ liệu!');
        this.dangTai = false;
        this.cdr.detectChanges();
      }
    });
  }
}