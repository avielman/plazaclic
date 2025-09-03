import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Product } from '../../models/product.model';
import { AuthService } from '../../services/auth';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.css']
})
export class AdminPanel implements OnInit {
  products$!: Observable<Product[]>;
  currentUser: any;

  constructor(
    private productService: ProductService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.currentUser = this.authService.getUser();
    if (this.currentUser && this.currentUser.userType === 'proveedor') {
      this.products$ = this.productService.getProductsForUser(this.currentUser.id);
    } else {
        this.products$ = of([]);
    }
  }

  deleteProduct(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          alert('Producto eliminado con éxito!');
          this.loadProducts(); // Refresh the list
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          alert('Error al eliminar producto: ' + (err.error.message || 'Error desconocido'));
        }
      });
    }
  }
}