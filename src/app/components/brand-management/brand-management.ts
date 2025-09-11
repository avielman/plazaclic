import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrandService } from '../../services/brand';
import { Brand } from '../../models/brand.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-brand-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './brand-management.html',
  styleUrls: ['./brand-management.css']
})
export class BrandManagement implements OnInit {
  brands$!: Observable<Brand[]>;
  brandForm: FormGroup;
  isEditing = false;
  currentBrandId: number | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private brandService: BrandService
  ) {
    this.brandForm = this.fb.group({
      name: ['', Validators.required],
      imagen: [null]
    });
  }

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.brands$ = this.brandService.getBrands();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onSubmit(): void {
    if (this.brandForm.invalid) {
      return;
    }

    const formData = new FormData();
    formData.append('name', this.brandForm.get('name')!.value);
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile, this.selectedFile.name);
    }

    if (this.isEditing && this.currentBrandId) {
      this.brandService.updateBrand(this.currentBrandId, formData).subscribe(() => {
        this.resetForm();
        this.loadBrands();
      });
    } else {
      this.brandService.addBrand(formData).subscribe(() => {
        this.resetForm();
        this.loadBrands();
      });
    }
  }

  editBrand(brand: Brand): void {
    this.isEditing = true;
    this.currentBrandId = brand.id;
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
    this.selectedFile = null;
    this.brandForm.reset();
    // Also reset the file input
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  }
}
