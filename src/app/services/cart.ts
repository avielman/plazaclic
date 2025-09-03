import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../models/product.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject: BehaviorSubject<CartItem[]> = new BehaviorSubject<CartItem[]>([]);
  public cartItems$: Observable<CartItem[]> = this.cartItemsSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const storedCart = localStorage.getItem('plazaclic_cart');
      if (storedCart) {
        this.cartItemsSubject.next(JSON.parse(storedCart));
      }
    }
  }

  private saveCart(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('plazaclic_cart', JSON.stringify(this.cartItemsSubject.value));
    }
  }

  addItem(product: Product, quantity: number = 1): void {
    const currentItems = this.cartItemsSubject.value;
    const existingItem = currentItems.find(item => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      currentItems.push({ product, quantity });
    }
    this.cartItemsSubject.next(currentItems);
    this.saveCart();
  }

  removeItem(productId: number): void {
    const currentItems = this.cartItemsSubject.value.filter(item => item.product.id !== productId);
    this.cartItemsSubject.next(currentItems);
    this.saveCart();
  }

  updateItemQuantity(productId: number, quantity: number): void {
    const currentItems = this.cartItemsSubject.value;
    const itemToUpdate = currentItems.find(item => item.product.id === productId);

    if (itemToUpdate) {
      itemToUpdate.quantity = quantity;
      if (itemToUpdate.quantity <= 0) {
        this.removeItem(productId);
      } else {
        this.cartItemsSubject.next(currentItems);
        this.saveCart();
      }
    }
  }

  getCartItems(): Observable<CartItem[]> {
    return this.cartItems$;
  }

  getTotal(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0))
    );
  }

  clearCart(): void {
    this.cartItemsSubject.next([]);
    this.saveCart();
  }
}