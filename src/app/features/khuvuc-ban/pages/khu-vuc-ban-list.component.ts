import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { KhuVucBanService, KhuVucVm, BanVm } from '../services/khu-vuc-ban.service';

@Component({
  selector: 'app-khu-vuc-ban',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './khu-vuc-ban-list.component.html'
})
export class KhuVucBanComponent implements OnInit {
  private service = inject(KhuVucBanService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  khuVucs: KhuVucVm[] = [];
  isLoading = true;

  // --- QUẢN LÝ MODAL ---
  isKhuVucModalOpen = false;
  isBanModalOpen = false;
  
  // Trạng thái: 'create' hoặc 'update'
  modalMode: 'create' | 'update' = 'create'; 
  
  khuVucForm!: FormGroup;
  banForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadData();
  }

  initForms(): void {
    this.khuVucForm = this.fb.group({
      soKV: ['', Validators.required],
      tenKV: ['', Validators.required],
      tgMo: [''],
      tgDong: [''],
      trangThaiKhu: ['Mở cửa'],
      phuThuKV: [0],
      ghiChuKV: ['']  
    });

    this.banForm = this.fb.group({
      soBan: ['', Validators.required],
      soKV: ['', Validators.required],
      tenBan: ['', Validators.required],
      trangThaiBan: ['Trống'],
      ghiChuBAN: ['']
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.service.getAllNested().subscribe({
      next: (res) => {
        if (res.success) this.khuVucs = res.data;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- LOGIC KHU VỰC ---
  openKhuVucModal(mode: 'create' | 'update', kv?: KhuVucVm): void {
    this.modalMode = mode;
    this.isKhuVucModalOpen = true;
    if (mode === 'update' && kv) {
      const formattedKv = {
        ...kv,
        tgMo: kv.tgMo ? kv.tgMo.substring(0, 5) : '',
        tgDong: kv.tgDong ? kv.tgDong.substring(0, 5) : ''
      };

      this.khuVucForm.patchValue(formattedKv);
      this.khuVucForm.get('soKV')?.disable();
    } else {
      this.khuVucForm.reset({ phuThuKV: 0, trangThaiKhu: 'Mở cửa' });
      this.khuVucForm.get('soKV')?.enable();
    }
  }

  submitKhuVuc(): void {
    if (this.khuVucForm.invalid) return;
    
    const data = this.khuVucForm.getRawValue(); 

    if (data.tgMo && data.tgMo.length === 5) data.tgMo += ':00';
    if (data.tgDong && data.tgDong.length === 5) data.tgDong += ':00';
    
    if (!data.tgMo) data.tgMo = null;
    if (!data.tgDong) data.tgDong = null;

    const request = this.modalMode === 'create' 
      ? this.service.createKhuVuc(data)
      : this.service.updateKhuVuc(data.soKV, data);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.isKhuVucModalOpen = false;
          this.loadData();
        } else {
          alert(res.message);
        }
      }
    });
  }

  // --- LOGIC BÀN ---
  openBanModal(mode: 'create' | 'update', ban?: BanVm, defaultSoKV?: string): void {
    this.modalMode = mode;
    this.isBanModalOpen = true;
    
    if (mode === 'update' && ban) {
      this.banForm.patchValue({
        soBan: ban.soBan,
        soKV: ban.soKV,
        tenBan: ban.tenBan,
        trangThaiBan: ban.trangThaiBan,
        ghiChuBAN: ban.ghiChuBAN
      });
      this.banForm.get('soBan')?.disable();
    } else {
      this.banForm.reset({ soKV: defaultSoKV || '', trangThaiBan: 'Trống', ghiChuBAN: '' });
      this.banForm.get('soBan')?.enable();
    }
  }

  submitBan(): void {
    if (this.banForm.invalid) return;
    
    const data = this.banForm.getRawValue();
    const request = this.modalMode === 'create' 
      ? this.service.createBan(data)
      : this.service.updateBan(data.soBan, data);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.isBanModalOpen = false;
          this.loadData();
        } else {
          alert(res.message);
        }
      }
    });
  }

  deleteBan(ban: BanVm): void {
    if (ban.trangThaiBan !== 'Trống') {
      alert('Không thể xóa bàn đang có khách hoặc đang bảo trì!');
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa ${ban.tenBan} ra khỏi danh mục không?`)) {
      this.service.deleteBan(ban.soBan).subscribe({
        next: (res) => {
          if (res.success) {
            alert(res.message);
            this.loadData();
          } else {
            alert(res.message);
          }
        },
        error: (err) => {
          console.error('Lỗi khi xóa bàn:', err);
          alert('Có lỗi xảy ra, không thể xóa bàn!');
        }
      });
    }
  }
}