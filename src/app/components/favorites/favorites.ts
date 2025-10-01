import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { FavoritesService } from '../../services/favorites.service';
import { CartService } from '../../services/cart';
import { ToastService } from '../../services/toast.service';
import { Product } from '../../models/product.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-favorites',
  imports: [CommonModule],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class FavoritesComponent implements OnInit, OnDestroy {
  favorites: Product[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private favoritesService: FavoritesService,
    private cartService: CartService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.favoritesService.getFavorites()
      .pipe(takeUntil(this.destroy$))
      .subscribe(favorites => {
        this.favorites = favorites;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeFromFavorites(productId: number): void {
    this.favoritesService.removeFromFavorites(productId);
  }

  clearFavorites(): void {
    if (confirm('¿Estás seguro de que deseas eliminar todos los favoritos?')) {
      this.favoritesService.clearFavorites();
    }
  }

  viewProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  addToCart(product: Product): void {
    this.cartService.addItem(product);
    this.toastService.showToast('Carrito', 'Agregado', 'Producto agregado al carrito', 'fa-solid fa-cart-plus', 'bg-success');
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
