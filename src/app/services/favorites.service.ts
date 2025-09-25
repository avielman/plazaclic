import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product.model';

interface FavoriteProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string[];
  brand: {
    id: number;
    name: string;
  };
  model: string;
  code: string;
  category: string[];
  quantity: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favoriteIds: number[] = [];
  private favoritesSubject = new BehaviorSubject<Product[]>([]);

  constructor() {
    this.loadFavoritesFromStorage();
  }

  getFavorites(): Observable<Product[]> {
    return this.favoritesSubject.asObservable();
  }

  addToFavorites(product: Product): void {
    if (!this.isFavorite(product.id)) {
      this.favoriteIds.push(product.id);
      this.saveFavoritesToStorage();
      this.favoritesSubject.next([...this.favoritesSubject.value, product]);
    }
  }

  removeFromFavorites(productId: number): void {
    this.favoriteIds = this.favoriteIds.filter(id => id !== productId);
    this.saveFavoritesToStorage();
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

  private saveFavoritesToStorage(): void {
    try {
      localStorage.setItem('favorites', JSON.stringify(this.favoriteIds));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Clearing old favorites data.');
        this.handleStorageQuotaExceeded();
      } else {
        console.error('Error saving favorites to localStorage:', error);
      }
    }
  }

  private handleStorageQuotaExceeded(): void {
    try {
      // Clear all localStorage and try again with just current favorites
      localStorage.clear();
      localStorage.setItem('favorites', JSON.stringify(this.favoriteIds));
    } catch (error) {
      // If still failing, keep only the last 10 favorites
      const limitedFavorites = this.favoriteIds.slice(-10);
      localStorage.setItem('favorites', JSON.stringify(limitedFavorites));
      this.favoriteIds = limitedFavorites;
      console.warn('localStorage quota still exceeded. Keeping only last 10 favorites.');
    }
  }

  private loadFavoritesFromStorage(): void {
    try {
      const stored = localStorage.getItem('favorites');
      if (stored) {
        this.favoriteIds = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
      this.favoriteIds = [];
    }
  }

  clearFavorites(): void {
    this.favoriteIds = [];
    this.saveFavoritesToStorage();
    this.favoritesSubject.next([]);
  }
}
