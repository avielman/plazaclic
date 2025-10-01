import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

interface ToastData {
  componente: string;
  header: string;
  mensaje: string;
  icono: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<ToastData>();
  toast$ = this.toastSubject.asObservable();

  showToast(componente: string, header: string, mensaje: string, icono: string, color: string) {
    this.toastSubject.next({ componente, header, mensaje, icono, color });
  }
}
