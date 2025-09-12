import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Brand } from '../models/brand.model';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private apiUrl = 'http://localhost:3000/api/brands';

  constructor(private http: HttpClient) { }

  getBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(this.apiUrl);
  }

  addBrand(brandData: { name: string; imagen: string }): Observable<Brand> {
    return this.http.post<Brand>(this.apiUrl, brandData);
  }

  updateBrand(id: number, brandData: { name: string; imagen: string }): Observable<Brand> {
    return this.http.put<Brand>(`${this.apiUrl}/${id}`, brandData);
  }

  deleteBrand(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
