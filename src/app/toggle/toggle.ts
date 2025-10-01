import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastService } from '../services/toast.service';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-toggle',
  imports: [],
  templateUrl: './toggle.html',
  styleUrl: './toggle.css'
})
export class Toggle implements OnInit, OnDestroy {
  toastComponente: string = '';
  toastHeader: string = '';
  toastMensaje: string = '';
  toastIcono: string = '';
  toastColor: string = '';
  toastColorClase: string = '';

  private subscription: Subscription = new Subscription();

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toast$.subscribe(data => {
      this.toastbtn(data.componente, data.header, data.mensaje, data.icono, data.color);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toastbtn(aComponente: string, aHeader: string, aMensaje: string, aIcono: string, aColor: string) {
    this.toastComponente = aComponente;
    this.toastHeader = aHeader;
    this.toastMensaje = aMensaje;
    this.toastIcono = aIcono;
    this.toastColor = aColor;

    switch (this.toastColor) {
      case 'bg-primary':
        this.toastColorClase = 'bg-toastBlue';
        break;
      case 'bg-secondary':
        this.toastColorClase = 'bg-toastGray';
        break;
      case 'bg-success':
        this.toastColorClase = 'bg-toastGreen';
        break;
      case 'bg-danger':
        this.toastColorClase = 'bg-toastRed';
        break;
      case 'bg-warning':
        this.toastColorClase = 'bg-toastYellow';
        break;
      default:
        this.toastColor = 'bg-primary';
        break;
    }


    var toastElList = [].slice.call(document.querySelectorAll('.toast'))
    var toastList = toastElList.map(function(toastEl) {
      return new bootstrap.Toast(toastEl);
    })
    toastList.forEach(toast => toast.show());
  }
}
