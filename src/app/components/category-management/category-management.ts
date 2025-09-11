import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../services/category';
import { Category } from '../../models/category.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-management.html',
  styleUrls: ['./category-management.css']
})
export class CategoryManagement implements OnInit {
  categories$!: Observable<Category[]>;
  categoryForm: FormGroup;
  isEditing = false;
  currentCategoryId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categories$ = this.categoryService.getCategories();
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    const categoryData = { name: this.categoryForm.value.name };

    if (this.isEditing && this.currentCategoryId) {
      this.categoryService.updateCategory(this.currentCategoryId, categoryData).subscribe(() => {
        this.resetForm();
        this.loadCategories();
      });
    } else {
      this.categoryService.addCategory(categoryData).subscribe(() => {
        this.resetForm();
        this.loadCategories();
      });
    }
  }

  editCategory(category: Category): void {
    this.isEditing = true;
    this.currentCategoryId = category.id;
    this.categoryForm.setValue({
      name: category.name
    });
  }

  deleteCategory(id: number): void {
    this.categoryService.deleteCategory(id).subscribe(() => {
      this.loadCategories();
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentCategoryId = null;
    this.categoryForm.reset();
  }
}
