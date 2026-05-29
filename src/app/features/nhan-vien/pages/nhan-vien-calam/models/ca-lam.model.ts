export interface CaLam {
  maCaLam: string;
  tenCa: string;
  tgVaoCa: string;
  tgRaCa: string;
}

export interface ChamCong {
  maChamCong: string;
  maNV: string;
  tenNhanVien?: string;
  maCaLam: string;
  tenCa?: string;
  tgChamCong: string;
}