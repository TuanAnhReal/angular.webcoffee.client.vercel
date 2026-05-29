export interface LoginRequest {
  tenDangNhap: string;
  matKhau: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  username: string;
  role: string;
  expiration: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserPayload {

  // ClaimTypes.Name
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': string;

  // ClaimTypes.Role
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;

  MaNV: string;

  exp: number;

  iss: string;

  aud: string;
}