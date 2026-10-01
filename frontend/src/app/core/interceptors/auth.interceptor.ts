import { HttpInterceptorFn, HttpErrorResponse, HttpClient, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);

  // Endpoints públicos de solo lectura que nunca deben fallar por problemas de autenticación
  const isPublicGet = req.method === 'GET' && (
    req.url.includes('/products') ||
    req.url.includes('/categories') ||
    req.url.includes('/ecommerce/banners') ||
    req.url.includes('/tenant/info')
  );

  let token = localStorage.getItem('access_token');

  // Si hay token, validar si está expirado antes de adjuntarlo para evitar 401 en cascada
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Token expirado: limpiarlo
          localStorage.removeItem('access_token');
          token = null;
        }
      }
    } catch {
      localStorage.removeItem('access_token');
      token = null;
    }
  }

  // Si es un GET público y no hay token válido, o incluso con token válido,
  // para endpoints públicos no es estrictamente necesario enviar token salvo que sea requerido.
  // Si hay token válido, lo adjuntamos normalmente.
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si un GET público falló con 401 (ej. token revocado o formato inválido),
      // limpiamos los tokens y reintentamos la solicitud limpia como usuario anónimo
      if (error.status === 401 && isPublicGet) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        const cleanReq = req.clone({
          headers: req.headers.delete('Authorization')
        });
        return next(cleanReq);
      }

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
              // Solo redirigir al login si el usuario está en el panel admin
              if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
                router.navigate(['/auth/login']);
              }
              return throwError(() => error);
            })
          );
        } else {
          isRefreshing = false;
          localStorage.removeItem('access_token');
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
            router.navigate(['/auth/login']);
          }
        }
      }
      return throwError(() => error);
    })
  );
};
