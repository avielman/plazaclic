import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Company } from '../models/company.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getCompany(userId: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/company/${userId}`);
  }

  updateCompany(company: Company): Observable<Company> {
    return this.http.put<Company>(`${this.apiUrl}/company/${company.userId}`, company);
  }

  getActividadComercial(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/actividad-comercial`);
  }
}
