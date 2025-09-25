import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product.model';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = 'http://localhost:3000/api';
  private favoriteIds: number[] = [];
  private favoritesSubject = new BehaviorSubject<Product[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadFavorites();
  }

  getFavorites(): Observable<Product[]> {
    return this.favoritesSubject.asObservable();
  }

  addToFavorites(product: Product): void {
    const user = this.authService.getUser();
    if (!user) return;

    if (!this.isFavorite(product.id)) {
      this.favoriteIds.push(product.id);
      this.saveFavorites();
      this.favoritesSubject.next([...this.favoritesSubject.value, product]);
    }
  }

  removeFromFavorites(productId: number): void {
    const user = this.authService.getUser();
    if (!user) return;

    this.favoriteIds = this.favoriteIds.filter(id => id !== productId);
    this.saveFavorites();
    const currentFavorites = this.favoritesSubject.value.filter(p => p.id !== productId);
    this.favoritesSubject.next(currentFavorites);
  }

  isFavorite(productId: number): boolean {
    return this.favoriteIds.includes(productId);
  }

  toggleFavorite(product: Product): boolean {
    if (this.isFavorite(product.id)) {
      this.removeFromFavorites(product.id);
      return false;
    } else {
      this.addToFavorites(product);
      return true;
    }
  }

  getFavoritesCount(): number {
    return this.favoriteIds.length;
  }

  private loadFavorites(): void {
    const user = this.authService.getUser();
    if (!user) {
      this.favoriteIds = [];
      this.favoritesSubject.next([]);
      return;
    }

    this.http.get<number[]>(`${this.apiUrl}/users/${user.id}/favorites`).pipe(
      switchMap(ids => {
        this.favoriteIds = ids || [];
        if (this.favoriteIds.length === 0) {
          return of([]);
        }
        const productRequests = this.favoriteIds.map(id =>
          this.http.get<Product>(`${this.apiUrl}/products/${id}`)
        );
        return forkJoin(productRequests);
      })
    ).subscribe({
      next: (products) => {
        this.favoritesSubject.next(products);
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
        this.favoriteIds = [];
        this.favoritesSubject.next([]);
      }
    });
  }

  private saveFavorites(): void {
    const user = this.authService.getUser();
    if (!user) return;

    this.http.put(`${this.apiUrl}/users/${user.id}/favorites`, { favorites: this.favoriteIds }).subscribe({
      next: () => {
        // Successfully saved
      },
      error: (error) => {
        console.error('Error saving favorites:', error);
      }
    });
  }

  clearFavorites(): void {
    const user = this.authService.getUser();
    if (!user) return;

    this.favoriteIds = [];
    this.saveFavorites();
    this.favoritesSubject.next([]);
  }
}
