import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Brand, Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getBrands(): Observable<Brand[]> {
    // In a real app, this would be a separate /api/brands endpoint
    // For now, we derive it from the products
    return this.http.get<Product[]>(`${this.apiUrl}/products`).pipe(
      map(products => {
        const brands = products.map(p => p.brand);
        const uniqueBrands = Array.from(new Map(brands.map(b => [b.id, b])).values());
        return uniqueBrands;
      })
    );
  }

  getProducts(filters?: any): Observable<Product[]> {
    let params = new HttpParams();
    if (filters) {
      for (const key in filters) {
        if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== '') {
          params = params.append(key, filters[key]);
        }
      }
    }
    return this.http.get<Product[]>(`${this.apiUrl}/products`, { params });
  }

  getProductsByBrand(brandName: string): Observable<Product[]> {
    // This method can now use the general getProducts with a brand filter
    return this.getProducts({ brand: brandName });
  }

  getFilteredAndSortedProducts(filters: any): Observable<Product[]> {
    return this.getProducts(filters);
  }

  getProductsForUser(userId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/my-products/${userId}`);
  }

  addProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  updateProduct(product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${product.id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }
}
