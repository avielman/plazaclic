import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { switchMap, startWith, take, map } from 'rxjs/operators';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css']
})
export class ProductListComponent implements OnInit {
  products$!: Observable<Product[]>;
  filterForm: FormGroup;
  allBrands: string[] = [];
  allCategories: string[] = [];

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private cartService: CartService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      minPrice: [null],
      maxPrice: [null],
      brands: this.fb.array([]), // Changed to FormArray
      categories: this.fb.array([]), // Changed to FormArray
      name: [''],
      sortBy: ['name'],
      sortOrder: ['asc']
    });
  }

  ngOnInit(): void {
    // Fetch all products initially to get unique brands and categories for filters
    this.productService.getProducts().subscribe(products => {
      this.allBrands = [...new Set(products.map(p => p.brand.name))];
      // Flatten categories array before creating a Set of unique categories
      this.allCategories = [...new Set(products.flatMap(p => p.category))];

      // Initialize FormArrays based on URL query params or default to all selected
      this.route.queryParams.pipe(take(1)).subscribe((queryParams: Params) => {
        const brandFromUrl = queryParams['brand']; // Access as string index
        if (brandFromUrl) {
          const selectedBrands = brandFromUrl.split(',');
          selectedBrands.forEach((brand: string) => this.brandsFormArray.push(new FormControl(brand)));
        } else {
          // Select all brands by default if no brand filter in URL
          this.allBrands.forEach((brand: string) => this.brandsFormArray.push(new FormControl(brand)));
        }

        const categoryFromUrl = queryParams['category']; // Access as string index
        if (categoryFromUrl) {
          const selectedCategories = categoryFromUrl.split(',');
          selectedCategories.forEach((category: string) => this.categoriesFormArray.push(new FormControl(category)));
        } else {
          // Select all categories by default if no category filter in URL
          this.allCategories.forEach((category: string) => this.categoriesFormArray.push(new FormControl(category)));
        }
        this.loadProducts(); // Load products after initial setup
      });
    });

    // Subscribe to form changes to reload products
    this.filterForm.valueChanges.subscribe(() => {
      this.loadProducts();
    });
  }

  get brandsFormArray(): FormArray {
    return this.filterForm.get('brands') as FormArray;
  }

  get categoriesFormArray(): FormArray {
    return this.filterForm.get('categories') as FormArray;
  }

  onBrandChange(event: any): void {
    const brand = event.target.value;
    const checked = event.target.checked;
    if (checked) {
      this.brandsFormArray.push(new FormControl(brand));
    } else {
      const index = this.brandsFormArray.controls.findIndex(x => x.value === brand);
      this.brandsFormArray.removeAt(index);
    }
    // No need to call applyFilters here, valueChanges subscription will handle it
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
    // No need to call applyFilters here, valueChanges subscription will handle it
  }

  loadProducts(): void {
    const formValues = this.filterForm.value;
    const filters = {
      ...formValues,
      brand: formValues.brands.join(','), // Convert array to comma-separated string for backend
      category: formValues.categories.join(',') // Convert array to comma-separated string for backend
    };
    // Remove the FormArray properties from filters object before passing to backend
    delete filters.brands;
    delete filters.categories;

    this.products$ = this.productService.getFilteredAndSortedProducts(filters).pipe(
      map(products => products.map(product => ({
        ...product,
        imageSrc: product.imageUrl && product.imageUrl.length > 0
          ? (product.imageUrl[0].startsWith('data:image') ? product.imageUrl[0] : 'data:image/jpeg;base64,' + product.imageUrl[0])
          : './../public/imagenes/product-not-available.jpg'
      })))
    );
  }

  applyFilters(): void {
    // This method is now redundant as valueChanges subscription handles it
    // It can be used to manually trigger a filter application if needed elsewhere
    this.loadProducts();
  }

  resetFilters(): void {
    this.filterForm.reset({
      minPrice: null,
      maxPrice: null,
      name: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
    // Clear and re-populate FormArrays to select all by default
    this.brandsFormArray.clear();
    this.allBrands.forEach(brand => this.brandsFormArray.push(new FormControl(brand)));
    this.categoriesFormArray.clear();
    this.allCategories.forEach(category => this.categoriesFormArray.push(new FormControl(category)));

    this.loadProducts();
  }

  addToCart(product: Product): void {
    this.cartService.addItem(product);
    alert('Producto añadido al carrito!');
  }
}
