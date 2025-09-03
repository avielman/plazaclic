import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Brand } from '../../models/product.model';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  brands$!: Observable<Brand[]>;

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    this.brands$ = this.productService.getBrands();
  }
}

