import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product';
import { AuthService } from '../../services/auth';
import { BrandService } from '../../services/brand';
import { CategoryService } from '../../services/category';
import { Product } from '../../models/product.model';
import { Brand } from '../../models/brand.model';
import { Category } from '../../models/category.model';
import { switchMap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

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
  allBrands: string[] = [];
  allCategories: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private authService: AuthService,
    private brandService: BrandService,
    private categoryService: CategoryService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      quantity: ['', [Validators.required, Validators.min(0)]],
      code: [{ value: '', disabled: true }, Validators.required],
      model: ['', Validators.required],
      brand: ['', Validators.required], // Changed to single select string
      categories: this.fb.array([]), // New FormArray for multiple categories
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

    // Fetch brands and categories from their respective services
    forkJoin({
      brands: this.brandService.getBrands(),
      categories: this.categoryService.getCategories()
    }).subscribe(({ brands, categories }) => {
      this.allBrands = brands.map(b => b.name);
      this.allCategories = categories.map(c => c.name).sort();

      // Generate code for new products
      if (!this.isEditMode) {
        this.generateProductCode();
      }

      // If in edit mode, fetch products for user and patch form
      if (this.isEditMode && this.productId) {
        this.productService.getProductsForUser(this.currentUser.id).subscribe(products => {
          const productToEdit = products.find(p => p.id === this.productId);
          if (productToEdit) {
            this.productForm.patchValue(productToEdit);
            this.productForm.get('brand')?.setValue(productToEdit.brand.name);
            this.setImages(productToEdit.imageUrl);
            this.setCategories(productToEdit.category);
          }
        });
      }
    });

    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.isEditMode = true;
          this.productId = +id;
          return of([]); // Already handled above
        } else {
          return of([]);
        }
      })
    ).subscribe();
  }

  get imageUrls(): FormArray {
    return this.productForm.get('imageUrl') as FormArray;
  }

  get categoriesFormArray(): FormArray {
    return this.productForm.get('categories') as FormArray;
  }

  onFileSelected(event: Event, index?: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        if (index !== undefined) {
          // Update existing image
          this.imageUrls.at(index).setValue(base64String);
        } else {
          // Add new image
          this.imageUrls.push(this.fb.control(base64String, Validators.required));
        }
      };
      reader.readAsDataURL(file);
    }
  }

  addFileInput(): void {
    this.imageUrls.push(this.fb.control('', Validators.required));
  }

  removeImageUrl(index: number): void {
    this.imageUrls.removeAt(index);
  }

  onCategoryChange(event: any): void {
    const category = event.target.value;
    const checked = event.target.checked;
    if (checked) {
      this.categoriesFormArray.push(new FormControl(category));
    } else {
      const index = this.categoriesFormArray.controls.findIndex(x => x.value === category);
      this.categoriesFormArray.removeAt(index);
    }
  }

  private setImages(imageUrls: string[]): void {
    const imageUrlFGs = imageUrls.map(url => this.fb.control(url, Validators.required));
    const imageUrlFormArray = this.fb.array(imageUrlFGs);
    this.productForm.setControl('imageUrl', imageUrlFormArray);
  }

  private setCategories(categories: string[]): void {
    const categoryFGs = categories.map(category => this.fb.control(category));
    const categoryFormArray = this.fb.array(categoryFGs);
    this.productForm.setControl('categories', categoryFormArray);
  }

  private generateProductCode(): void {
    const timestamp = Date.now();
    const codeNumber = (timestamp % 10000000).toString().padStart(7, '0');
    const code = `STK${codeNumber}`;
    this.productForm.get('code')?.setValue(code);
  }

  resetForm(): void {
    this.productForm.reset();
    this.isEditMode = false;
    this.productId = null;
  }

  cancel(): void {
    this.router.navigate(['/admin/products']);
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      alert('Por favor, complete todos los campos requeridos.');
      return;
    }

    const productData: Product = { ...this.productForm.getRawValue() };

    // Convert categories FormArray to comma-separated string for backend
    productData.category = this.categoriesFormArray.value; // Assign directly as array

    // Handle brand object for backend
    const selectedBrandName = this.productForm.get('brand')?.value;
    const selectedBrand = this.allBrands.find(b => b === selectedBrandName); // Find existing brand
    if (selectedBrand) {
      productData.brand = { id: 0, name: selectedBrand, logoUrl: '' }; // Dummy ID and logoUrl
    } else {
      productData.brand = { id: 0, name: selectedBrandName, logoUrl: '' }; // Use entered name
    }

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
