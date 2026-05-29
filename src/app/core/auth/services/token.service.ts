import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private readonly ACCESS_TOKEN_KEY = 'ACCESS_TOKEN';
  private readonly REFRESH_TOKEN_KEY = 'REFRESH_TOKEN';

  // =========================
  // GET TOKENS
  // =========================

  getAccessToken(): string | null {

    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {

    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // =========================
  // SAVE TOKENS
  // =========================

  setTokens(
    accessToken: string,
    refreshToken: string
  ): void {

    localStorage.setItem(
      this.ACCESS_TOKEN_KEY,
      accessToken
    );

    localStorage.setItem(
      this.REFRESH_TOKEN_KEY,
      refreshToken
    );
  }

  // =========================
  // REMOVE TOKENS
  // =========================

  removeTokens(): void {

    localStorage.removeItem(this.ACCESS_TOKEN_KEY);

    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // =========================
  // CHECK TOKEN
  // =========================

  hasAccessToken(): boolean {

    return !!this.getAccessToken();
  }
}