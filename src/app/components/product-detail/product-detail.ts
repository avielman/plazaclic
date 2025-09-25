import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { FavoritesService } from '../../services/favorites.service';
import { Product } from '../../models/product.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {
  product: Product | null = null;
  selectedImageIndex: number = 0;
  isZoomed: boolean = false;

  showModal: boolean = false;
  modalImageIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProductById(+id).subscribe({
        next: (product) => {
          this.product = product;
          // Set imageSrc for compatibility
          if (product.imageUrl && product.imageUrl.length > 0) {
            product.imageSrc = product.imageUrl[0];
          }
        },
        error: (error) => {
          console.error('Error loading product:', error);
          // Redirect to products list if product not found
          this.router.navigate(['/products']);
        }
      });
    }
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
    if (this.product) {
      this.product.imageSrc = this.product.imageUrl[index];
    }
  }

  onCarouselSlide(event: any): void {
    // Update selectedImageIndex when carousel slides
    this.selectedImageIndex = event.to;
  }

  openModal(index: number): void {
    this.modalImageIndex = index;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (this.showModal) {
      this.closeModal();
    }
  }

  prevModalImage(): void {
    if (!this.product) return;
    this.modalImageIndex = (this.modalImageIndex - 1 + this.product.imageUrl.length) % this.product.imageUrl.length;
  }

  nextModalImage(): void {
    if (!this.product) return;
    this.modalImageIndex = (this.modalImageIndex + 1) % this.product.imageUrl.length;
  }

  addToCart(): void {
    if (this.product) {
      this.cartService.addItem(this.product);
      // Optional: Show success message or navigate to cart
      alert('Producto agregado al carrito');
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  toggleFavorite(): void {
    if (this.product) {
      const isFavorite = this.favoritesService.toggleFavorite(this.product);
      if (isFavorite) {
        alert('Producto agregado a favoritos');
      } else {
        alert('Producto eliminado de favoritos');
      }
    }
  }

  isFavorite(): boolean {
    return this.product ? this.favoritesService.isFavorite(this.product.id) : false;
  }

  get selectedImage(): string {
    if (this.product && this.product.imageUrl && this.product.imageUrl.length > 0) {
      return this.product.imageUrl[this.selectedImageIndex];
    }
    return '';
  }

  get modalImage(): string {
    if (this.product && this.product.imageUrl && this.product.imageUrl.length > 0) {
      return this.product.imageUrl[this.modalImageIndex];
    }
    return '';
  }
}
