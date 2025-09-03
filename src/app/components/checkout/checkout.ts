import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CartService, CartItem } from '../../services/cart';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class CheckoutComponent implements OnInit {
  checkoutForm: FormGroup;
  cartItems$!: Observable<CartItem[]>;
  total$!: Observable<number>;
  currentUser: any;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {
    this.checkoutForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      zip: ['', Validators.required],
      country: ['', Validators.required],
      paymentMethod: ['credit_card', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cartItems$ = this.cartService.getCartItems();
    this.total$ = this.cartService.getTotal();
    this.currentUser = this.authService.getUser();

    // Pre-fill form if user is logged in
    if (this.currentUser) {
      this.checkoutForm.patchValue({
        name: this.currentUser.email, // Using email as name for simplicity
        // address, city, zip, country would come from user profile in a real app
      });
    }
  }

  placeOrder(): void {
    if (this.checkoutForm.invalid) {
      alert('Por favor, complete todos los campos requeridos.');
      return;
    }

    this.cartItems$.subscribe(items => {
      if (items.length === 0) {
        alert('Tu carrito está vacío.');
        this.router.navigate(['/products']);
        return;
      }

      const orderData = {
        customerInfo: this.checkoutForm.value,
        items: items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        })),
        total: this.total$,
        userId: this.currentUser ? this.currentUser.id : null
      };

      this.orderService.placeOrder(orderData).subscribe({
        next: (response) => {
          alert('Pedido realizado con éxito! ID: ' + response.id);
          this.cartService.clearCart();
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Error al realizar el pedido:', err);
          alert('Error al realizar el pedido: ' + (err.error.message || 'Error desconocido'));
        }
      });
    }).unsubscribe(); // Unsubscribe to prevent memory leaks
  }
}