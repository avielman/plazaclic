import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboardComponent implements OnInit {
  currentUser: any;

  constructor(
     private router: Router, private authService: AuthService)
    { }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    if (!this.currentUser || this.currentUser.userType !== 'proveedor') {
      alert('Acceso denegado. Solo proveedores pueden acceder al panel de administración.');
      this.router.navigate(['/']);
      return;
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
