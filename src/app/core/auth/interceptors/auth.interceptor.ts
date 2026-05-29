import { HttpInterceptorFn } from '@angular/common/http';

import { inject } from '@angular/core';

import { environment } from '../../../../environments/environment.development';

import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = ( req, next) => {

  const tokenService = inject(TokenService);
  const accessToken = tokenService.getAccessToken();
  const isApiRequest = req.url.startsWith( environment.apiUrl );

  if ( accessToken && isApiRequest ) {
    const authRequest = req.clone({
        setHeaders: { Authorization: `Bearer ${accessToken}` }
      });
    return next(authRequest);
  }
  return next(req);
};

