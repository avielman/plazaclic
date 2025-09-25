import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { CommonModule, NgForOf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

interface Breadcrumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [CommonModule, RouterModule, NgForOf],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css'
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: Breadcrumb[] = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        console.log('NavigationEnd event detected, rebuilding breadcrumbs');
        this.breadcrumbs = this.buildBreadcrumbsFromRoute(this.activatedRoute.root);
        console.log('Breadcrumbs generated:', this.breadcrumbs);
      });

    // Initial breadcrumb creation
    console.log('Initial breadcrumb creation');
    this.breadcrumbs = this.buildBreadcrumbsFromRoute(this.activatedRoute.root);
    console.log('Initial breadcrumbs:', this.breadcrumbs);
  }

  private buildBreadcrumbsFromRoute(route: ActivatedRoute): Breadcrumb[] {
    const breadcrumbs: Breadcrumb[] = [];
    const routeSegments: ActivatedRoute[] = [];

    // Collect all routes from current to root
    let currentRoute: ActivatedRoute | null = route;
    while (currentRoute) {
      routeSegments.unshift(currentRoute);
      currentRoute = currentRoute.parent;
    }

    console.log('Route segments found:', routeSegments.length);
    console.log('Current route path:', route.snapshot.url.map(s => s.path).join('/'));

    // Build breadcrumbs from the collected segments
    let url = '';
    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];

      // Build URL up to this segment
      const urlSegments = routeSegment.snapshot.url;
      if (urlSegments.length > 0) {
        const routePath = urlSegments.map(segment => segment.path).join('/');
        url += `/${routePath}`;
      }

      // Get breadcrumb label from route data
      const breadcrumbData = routeSegment.snapshot.data['breadcrumb'];
      const routeParams = routeSegment.snapshot.params;

      console.log(`Route ${i}:`, {
        path: routeSegment.snapshot.url.map(s => s.path).join('/') || '(root)',
        breadcrumbData: breadcrumbData,
        params: routeParams,
        url: url
      });

      if (breadcrumbData) {
        const label = this.getBreadcrumbLabel(breadcrumbData, routeParams);

        // Only add link if it's not the last breadcrumb (current page)
        const isLast = i === routeSegments.length - 1;
        breadcrumbs.push({
          label: label,
          link: isLast ? undefined : url || '/'
        });

        console.log(`Added breadcrumb: ${label} -> ${url || '/'}`);
      }
    }

    console.log('Final breadcrumbs:', breadcrumbs);
    return breadcrumbs;
  }



  private getBreadcrumbLabel(data: any, params?: any): string {
    if (typeof data === 'string') {
      return data;
    }

    // Handle dynamic routes with parameters
    if (params && params.id) {
      // If it's a product detail route, show "Producto" instead of the ID
      if (data === 'Detalle del Producto') {
        return 'Producto';
      }
    }

    // Custom mapping for routes
    const routeMap: { [key: string]: string } = {
      '': 'Inicio',
      'products': 'Productos',
      'cart': 'Carrito',
      'checkout': 'Checkout',
      'login': 'Iniciar Sesión',
      'register': 'Registro',
      'admin': 'Administración',
      'favorites': 'Favoritos'
    };

    // If it's a number, it might be a product ID, so we'll show "Producto" as label
    if (typeof data === 'number') {
      return 'Producto';
    }

    return routeMap[data] || data;
  }
}
