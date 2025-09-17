import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { Product } from '../../models/product.model';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
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

  toggleZoom(): void {
    this.isZoomed = !this.isZoomed;
  }

  addToCart(): void {
    if (this.product) {
      this.cartService.addItem(this.product);
      // Optional: Show success message or navigate to cart
      alert('Producto agregado al carrito');
    }
  }

  get selectedImage(): string {
    if (this.product && this.product.imageUrl && this.product.imageUrl.length > 0) {
      return this.product.imageUrl[this.selectedImageIndex];
    }
    return '';
  }
}
