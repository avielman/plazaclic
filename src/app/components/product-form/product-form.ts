import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product';
import { AuthService } from '../../services/auth';
import { Product } from '../../models/product.model';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.css']
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  private productId: number | null = null;
  private currentUser: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private authService: AuthService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      quantity: ['', [Validators.required, Validators.min(0)]],
      code: ['', Validators.required],
      category: ['', Validators.required],
      model: ['', Validators.required],
      brand: this.fb.group({
        id: [null],
        name: ['', Validators.required],
        logoUrl: ['']
      }),
      imageUrl: this.fb.array([]) // Initialize as FormArray
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    if (!this.currentUser || this.currentUser.userType !== 'proveedor') {
      alert('Acceso denegado. Solo proveedores pueden gestionar productos.');
      this.router.navigate(['/']);
      return;
    }

    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.isEditMode = true;
          this.productId = +id;
          return this.productService.getProductsForUser(this.currentUser.id);
        } else {
          return of([]);
        }
      })
    ).subscribe(products => {
      if (this.isEditMode && products.length > 0) {
        const product = products.find(p => p.id === this.productId);
        if (product) {
          this.productForm.patchValue(product);
          // Populate imageUrl FormArray
          this.setImages(product.imageUrl);
        }
      }
    });
  }

  get imageUrls(): FormArray {
    return this.productForm.get('imageUrl') as FormArray;
  }

  addImageUrl(): void {
    this.imageUrls.push(this.fb.control('', Validators.required));
  }

  removeImageUrl(index: number): void {
    this.imageUrls.removeAt(index);
  }

  private setImages(imageUrls: string[]): void {
    const imageUrlFGs = imageUrls.map(url => this.fb.control(url, Validators.required));
    const imageUrlFormArray = this.fb.array(imageUrlFGs);
    this.productForm.setControl('imageUrl', imageUrlFormArray);
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      alert('Por favor, complete todos los campos requeridos.');
      return;
    }

    const productData: Product = { ...this.productForm.value };

    if (this.isEditMode) {
      productData.id = this.productId!;
      this.productService.updateProduct(productData).subscribe({
        next: () => {
          alert('Producto actualizado con éxito!');
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          console.error('Error al actualizar producto:', err);
          alert('Error al actualizar producto: ' + (err.error.message || 'Error desconocido'));
        }
      });
    } else {
      productData.ownerId = this.currentUser.id;
      // For new products, assign a dummy brand if not provided
      if (!productData.brand || !productData.brand.name) {
        productData.brand = { id: 999, name: 'Generica', logoUrl: '' };
      }
      // For new products, assign a dummy image if not provided
      if (!productData.imageUrl || productData.imageUrl.length === 0) {
        productData.imageUrl = ['https://via.placeholder.com/300/CCCCCC/FFFFFF/?text=NoImage'];
      }

      this.productService.addProduct(productData).subscribe({
        next: () => {
          alert('Producto agregado con éxito!');
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          console.error('Error al agregar producto:', err);
          alert('Error al agregar producto: ' + (err.error.message || 'Error desconocido'));
        }
      });
    }
  }
}