import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { InventoryService } from '../../services/inventory';
import { AuthService } from '../../services/auth';
import { InventoryMovement } from '../../models/inventory-movement.model';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css']
})
export class InventoryComponent implements OnInit {
  movementForm: FormGroup;
  movements$!: Observable<InventoryMovement[]>;
  productId!: number;
  productName: string = '';
  productQuantity: number = 0;
  currentUser: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private authService: AuthService,
    private productService: ProductService
  ) {
    this.movementForm = this.fb.group({
      type: ['entry', Validators.required],
      quantity: [null, [Validators.required, Validators.min(1)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    if (!this.currentUser || this.currentUser.userType !== 'proveedor') {
      alert('Acceso denegado. Solo proveedores pueden gestionar el inventario.');
      this.router.navigate(['/']);
      return;
    }

    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('productId');
        if (id) {
          this.productId = +id;
          // Fetch product name for display
          return this.productService.getProductsForUser(this.currentUser.id).pipe(
            map(products => products.find(p => p.id === this.productId))
          );
        }
        return of(null);
      })
    ).subscribe((product: Product | undefined | null) => {
      if (product) {
        this.productName = product.name;
        this.productQuantity = product.quantity;
        this.loadMovements();
      } else {
        alert('Producto no encontrado o no tienes permiso para verlo.');
        this.router.navigate(['/admin']);
      }
    });
  }

  loadMovements(): void {
    this.movements$ = this.inventoryService.getMovementHistory(this.productId);
  }

  recordMovement(): void {
    if (this.movementForm.invalid) {
      alert('Por favor, complete la cantidad y el tipo de movimiento.');
      return;
    }

    const movementData: InventoryMovement = {
      id: 0, // Will be assigned by backend
      productId: this.productId,
      userId: this.currentUser.id,
      date: new Date().toISOString(),
      ...this.movementForm.value
    };

    this.inventoryService.recordMovement(movementData).subscribe({
      next: () => {
        alert('Movimiento de inventario registrado con éxito!');
        this.movementForm.reset({ type: 'entry', quantity: null, notes: '' });
        this.loadMovements(); // Refresh list
        // Reload product to update quantity
        this.productService.getProductsForUser(this.currentUser.id).pipe(
          map(products => products.find(p => p.id === this.productId))
        ).subscribe(updatedProduct => {
          if (updatedProduct) {
            this.productQuantity = updatedProduct.quantity;
          }
        });
      },
      error: (err) => {
        console.error('Error al registrar movimiento:', err);
        alert('Error al registrar movimiento: ' + (err.error.message || 'Error desconocido'));
      }
    });
  }
}
