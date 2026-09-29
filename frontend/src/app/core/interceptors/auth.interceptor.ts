import { HttpInterceptorFn, HttpErrorResponse, HttpClient, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);

  const token = localStorage.getItem('access_token');

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token && !isRefreshing) {
        isRefreshing = true;
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
          const noCacheHeaders = new HttpHeaders({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          });
          return http.post<any>(`${environment.apiUrl}/auth/token/refresh/`, { refresh: refreshToken }, { headers: noCacheHeaders }).pipe(
            switchMap((res: any) => {
              isRefreshing = false;
              localStorage.setItem('access_token', res.access);
              if (res.refresh) {
                localStorage.setItem('refresh_token', res.refresh);
              }
              const newReq = req.clone({
                setHeaders: { Authorization: `Bearer ${res.access}` }
              });
              return next(newReq);
            }),
            catchError(() => {
              isRefreshing = false;
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              router.navigate(['/auth/login']);
              return throwError(() => error);
            })
          );
        } else {
          isRefreshing = false;
          localStorage.removeItem('access_token');
          router.navigate(['/auth/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
