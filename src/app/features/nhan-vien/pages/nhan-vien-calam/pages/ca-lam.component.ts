import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CaLam, ChamCong } from '../models/ca-lam.model';
import { environment } from '../../../../../../environments/environment.development';

@Component({
  selector: 'app-ca-lam',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ca-lam.component.html'
})
export class CaLamComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = environment.apiUrl;

  dangTai = true;
  hienModalCaLam = false;
  caLamForm!: FormGroup;

  // Sử dụng Signal quản lý danh sách
  danhSachCaLam = signal<CaLam[]>([]);
  danhSachChamCong = signal<ChamCong[]>([]);

  ngOnInit(): void {
    this.khoiTaoForm();
    this.taiDuLieuHànhChinh();
  }

  khoiTaoForm(): void {
    this.caLamForm = this.fb.group({
      maCaLam: ['', [Validators.required]],
      tenCa: ['', [Validators.required]],
      tgVaoCa: ['', [Validators.required]],
      tgRaCa: ['', [Validators.required]]
    });
  }

  taiDuLieuHànhChinh(): void {
    this.dangTai = true;
    forkJoin({
      caLams: this.http.get<any>(`${this.apiUrl}/CaLams`),
      chamCongs: this.http.get<any>(`${this.apiUrl}/ChamCongs`)
    }).subscribe({
      next: (res) => {
        const cl = res.caLams?.success ? res.caLams.data : (Array.isArray(res.caLams) ? res.caLams : []);
        const cc = res.chamCongs?.success ? res.chamCongs.data : (Array.isArray(res.chamCongs) ? res.chamCongs : []);

        this.danhSachCaLam.set(cl);
        this.danhSachChamCong.set(cc);

        this.dangTai = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải dữ liệu ca làm/chấm công:', err);
        this.dangTai = false;
        this.cdr.detectChanges();
      }
    });
  }

  themCaLamMoi(): void {
    if (this.caLamForm.invalid) {
      this.caLamForm.markAllAsTouched();
      return;
    }

    const duLieuForm = this.caLamForm.value;
    this.http.post<any>(`${this.apiUrl}/CaLams`, duLieuForm).subscribe({
      next: (res) => {
        alert('Thêm ca làm việc mới thành công!');
        this.hienModalCaLam = false;
        this.caLamForm.reset();
        this.taiDuLieuHànhChinh(); // Tải lại bảng dữ liệu
      },
      error: (err) => alert(err.error?.message || 'Lỗi thêm ca làm việc!')
    });
  }
}