import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { BrandService } from '../../services/brand';
import { Brand } from '../../models/brand.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-brand-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './brand-management.html',
  styleUrls: ['./brand-management.css']
})
export class BrandManagement implements OnInit {
  brands$!: Observable<Brand[]>;
  brandForm: FormGroup;
  isEditing = false;
  currentBrandId: number | null = null;
  selectedImageBase64: string | null = null;

  constructor(
    private fb: FormBuilder,
    private brandService: BrandService
  ) {
    this.brandForm = this.fb.group({
      name: ['', Validators.required],
      imagen: ['']
    });
  }

  ngOnInit(): void {
    this.loadBrands();
  }

  sortBy: 'id' | 'name' = 'id';

  loadBrands(): void {
    this.brands$ = this.brandService.getBrands().pipe(
      map(brands => {
        if (this.sortBy === 'name') {
          return brands.sort((a, b) => a.name.localeCompare(b.name));
        } else {
          return brands.sort((a, b) => a.id - b.id);
        }
      })
    );
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.convertFileToBase64(file);
    }
  }

  private convertFileToBase64(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.selectedImageBase64 = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.brandForm.invalid) {
      return;
    }

    const brandData = {
      name: this.brandForm.get('name')!.value,
      imagen: this.selectedImageBase64 || ''
    };

    if (this.isEditing && this.currentBrandId) {
      this.brandService.updateBrand(this.currentBrandId, brandData).subscribe(() => {
        this.resetForm();
        this.loadBrands();
      });
    } else {
      this.brandService.addBrand(brandData).subscribe(() => {
        this.resetForm();
        this.loadBrands();
      });
    }
  }

  editBrand(brand: Brand): void {
    this.isEditing = true;
    this.currentBrandId = brand.id;
    this.selectedImageBase64 = brand.imagen;
    this.brandForm.patchValue({
      name: brand.name
    });
  }

  deleteBrand(id: number): void {
    this.brandService.deleteBrand(id).subscribe(() => {
      this.loadBrands();
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentBrandId = null;
    this.selectedImageBase64 = null;
    this.brandForm.reset();
    // Also reset the file input
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  }
}
