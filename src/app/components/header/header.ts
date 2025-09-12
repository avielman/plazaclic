import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../services/auth';
import { CartService, CartItem } from '../../services/cart';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  isLoggedIn$: Observable<boolean>;
  cartItemCount$: Observable<number>;

  constructor(private authService: AuthService, private cartService: CartService) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.cartItemCount$ = this.cartService.cartItems$.pipe(
      map(items => items.reduce((acc, item) => acc + item.quantity, 0))
    );

    // Debug: Log the current login status
    this.isLoggedIn$.subscribe(value => {
      console.log('HeaderComponent - isLoggedIn$ value:', value);
    });
  }

  logout(): void {
    this.authService.logout();
  }
}

