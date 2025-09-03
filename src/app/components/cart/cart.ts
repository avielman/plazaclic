import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { CartService, CartItem } from '../../services/cart';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartComponent implements OnInit {
  cartItems$!: Observable<CartItem[]>;
  total$!: Observable<number>;

  constructor(private cartService: CartService) { }

  ngOnInit(): void {
    this.cartItems$ = this.cartService.getCartItems();
    this.total$ = this.cartService.getTotal();
  }

  removeItem(productId: number): void {
    this.cartService.removeItem(productId);
  }

  updateQuantity(item: CartItem, event: Event): void {
    const newQuantity = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      this.cartService.updateItemQuantity(item.product.id, newQuantity);
    }
  }

  clearCart(): void {
    this.cartService.clearCart();
  }
}

