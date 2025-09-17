import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryMovement } from '../models/inventory-movement.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  recordMovement(movement: InventoryMovement): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(`${this.apiUrl}/inventory-movements`, movement);
  }

  updateMovement(id: number, movement: Partial<InventoryMovement>): Observable<InventoryMovement> {
    return this.http.put<InventoryMovement>(`${this.apiUrl}/inventory-movements/${id}`, movement);
  }

  getMovementHistory(productId: number): Observable<InventoryMovement[]> {
    return this.http.get<InventoryMovement[]>(`${this.apiUrl}/inventory-movements/${productId}`);
  }
}
