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
  computedTotal: number = 0;
  totalEntries: number = 0;
  totalExits: number = 0;
  currentUser: any;
  editingMode: boolean = false;
  selectedMovement: InventoryMovement | null = null;
  oldQuantity: number = 0;

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
      value: [null, [Validators.min(0)]],
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

  onSelectMovement(movement: InventoryMovement): void {
    this.selectedMovement = movement;
    this.editingMode = false;
  }

  onEditMovement(): void {
    if (!this.selectedMovement) return;

    const password = prompt('Ingrese su contraseña para editar el movimiento:');
    if (password !== 'Linux123@') {
      alert('Contraseña incorrecta. No se puede editar el movimiento.');
      return;
    }

    this.editingMode = true;
    this.oldQuantity = this.selectedMovement.quantity;
    this.movementForm.patchValue({
      type: this.selectedMovement.type,
      quantity: this.selectedMovement.quantity,
      value: this.selectedMovement.value || null,
      notes: this.selectedMovement.notes || ''
    });
  }

  onCancelEdit(): void {
    this.editingMode = false;
    this.selectedMovement = null;
    this.movementForm.reset({ type: 'entry', quantity: null, value: null, notes: '' });
  }

  loadMovements(): void {
    this.movements$ = this.inventoryService.getMovementHistory(this.productId).pipe(
      map(movements => {
        this.totalEntries = movements
          .filter(m => m.type === 'entry')
          .reduce((sum, m) => sum + m.quantity, 0);
        this.totalExits = movements
          .filter(m => m.type === 'exit')
          .reduce((sum, m) => sum + m.quantity, 0);
        this.computedTotal = this.totalEntries - this.totalExits;
        this.productQuantity = this.computedTotal;
        return movements;
      })
    );
  }

  recordMovement(): void {
    const formValue = this.movementForm.value;
    const type = formValue.type;

    if (this.movementForm.invalid) {
      let errorMsg = 'Por favor, complete los campos requeridos.';
      if (type === 'entry' && (!formValue.value || formValue.value < 0)) {
        errorMsg += ' Para entradas, el valor (costo) debe ser un número positivo o cero.';
      }
      alert(errorMsg);
      return;
    }

    if (this.editingMode && this.selectedMovement) {
      // Update existing movement
      const updateData = {
        type,
        quantity: formValue.quantity,
        ...(type === 'entry' ? { value: formValue.value } : {}),
        notes: formValue.notes || ''
      };

      this.inventoryService.updateMovement(this.selectedMovement.id, updateData).subscribe({
        next: () => {
          alert('Movimiento actualizado con éxito!');
          this.editingMode = false;
          this.selectedMovement = null;
          this.movementForm.reset({ type: 'entry', quantity: null, value: null, notes: '' });
          this.loadMovements(); // Refresh list
        },
        error: (err) => {
          console.error('Error al actualizar movimiento:', err);
          alert('Error al actualizar movimiento: ' + (err.error.message || 'Error desconocido'));
        }
      });
    } else {
      // Create new movement
      const movementData: InventoryMovement = {
        id: 0, // Will be assigned by backend
        productId: this.productId,
        userId: this.currentUser.id,
        date: new Date().toISOString(),
        type,
        quantity: formValue.quantity,
        notes: formValue.notes || ''
      };

      if (type === 'entry') {
        movementData.value = formValue.value;
      }

      this.inventoryService.recordMovement(movementData).subscribe({
        next: () => {
          alert('Movimiento de inventario registrado con éxito!');
          this.movementForm.reset({ type: 'entry', quantity: null, value: null, notes: '' });
          this.loadMovements(); // Refresh list
          // The computedTotal will update via the pipe in loadMovements
        },
        error: (err) => {
          console.error('Error al registrar movimiento:', err);
          alert('Error al registrar movimiento: ' + (err.error.message || 'Error desconocido'));
        }
      });
    }
  }
}
