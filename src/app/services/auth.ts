import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private _isLoggedIn$ = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this._isLoggedIn$.asObservable();

  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.getUser();
      if (token) {
        this._isLoggedIn$.next(true);
      }
    }
  }

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('plazaclic_user', JSON.stringify(response.user));
          this._isLoggedIn$.next(true);
          this.router.navigate(['/admin']);
        }
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('plazaclic_user');
      this._isLoggedIn$.next(false);
      this.router.navigate(['/']);
    }
  }

  getUser(): any | null {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('plazaclic_user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }
}
