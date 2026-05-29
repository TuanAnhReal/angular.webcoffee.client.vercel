import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError, catchError, switchMap, finalize } from 'rxjs';
import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { ApiService } from '../../services/api.service';
import { TokenService } from './token.service';
import { LoginRequest, LoginResponse, UserPayload } from '../models/auth.model';
import { ApiResponse } from '../../models/api-response.model';
import { environment } from '../../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiService = inject(ApiService);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  currentUser = signal<UserPayload | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);

  currentRole = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return user['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
  });

  private isRefreshing = false;

  constructor() {
    this.restoreUserSession();
  }

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.apiService
      .post<ApiResponse<LoginResponse>>('/auth/login', request)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.tokenService.setTokens(response.data.token, response.data.refreshToken);
            this.restoreUserSession();
          }
        })
      );
  }

  revoke(): Observable<ApiResponse<null>> {
    return this.apiService.post<ApiResponse<null>>('/auth/revoke', {});
  }

  getMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Auth/me`);
  }

  clearSession(): void {
    this.tokenService.removeTokens();
    this.currentUser.set(null);
  }

  logout(): void {
    this.revoke().pipe(
      catchError(() => []),
      finalize(() => {
        this.clearSession();
        this.router.navigate(['/login']);
      })
    ).subscribe();
  }

  restoreUserSession(): void {
    const token = this.tokenService.getAccessToken();
    if (!token) {
      this.currentUser.set(null);
      return;
    }
    try {
      const decoded = jwtDecode<UserPayload>(token);
      const isExpired = decoded.exp * 1000 < Date.now();
      if (isExpired) {
        this.clearSession();
        return;
      }
      this.currentUser.set(decoded);
    } catch {
      this.clearSession();
    }
  }

  refreshToken(): Observable<ApiResponse<LoginResponse>> {
    const refreshToken = this.tokenService.getRefreshToken();
    return this.apiService.post<ApiResponse<LoginResponse>>('/auth/refresh-token', { refreshToken })
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.tokenService.setTokens(response.data.token, response.data.refreshToken);
            this.restoreUserSession();
          }
        })
      );
  }

  handleRefreshToken(request: HttpRequest<any>, next: HttpHandlerFn) {
    if (this.isRefreshing) {
      return throwError(() => new Error('Refreshing token'));
    }
    this.isRefreshing = true;
    return this.refreshToken().pipe(
      switchMap((response) => {
        const newAccessToken = response.data.token;
        const clonedRequest = request.clone({
          setHeaders: { Authorization: `Bearer ${newAccessToken}` }
        });
        return next(clonedRequest);
      }),
      catchError((error) => {
        this.logout();
        return throwError(() => error);
      }),
      finalize(() => {
        this.isRefreshing = false;
      })
    );
  }

  hasRole(role: string): boolean {
    return this.currentRole() === role;
  }

  hasRoles(allowedRoles: string[]): boolean {
    if (this.currentRole() === 'Quản trị viên') return true;
    return allowedRoles.includes(this.currentRole());
  }
}