import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Brand } from '../../models/brand.model';
import { BrandService } from '../../services/brand';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  brands$!: Observable<Brand[]>;

  constructor(private brandService: BrandService) { }

  ngOnInit(): void {
    this.brands$ = this.brandService.getBrands();
  }
}

