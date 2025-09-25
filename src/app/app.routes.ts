import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { ProductListComponent } from './components/product-list/product-list';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { ProductAdminListComponent } from './components/product-admin-list/product-admin-list';
import { CartComponent } from './components/cart/cart';
import { CheckoutComponent } from './components/checkout/checkout';
import { InventoryComponent } from './components/inventory/inventory';
import { CompanyManagement } from './components/company-management/company-management';
import { CategoryManagement } from './components/category-management/category-management';
import { BrandManagement } from './components/brand-management/brand-management';

import { authGuard } from './services/auth-guard';

import { ProductFormComponent } from './components/product-form/product-form';

import { ProductDetail } from './components/product-detail/product-detail';
import { FavoritesComponent } from './components/favorites/favorites';

export const routes: Routes = [
    { path: '', component: HomeComponent, data: { breadcrumb: 'Inicio' } },
    {
        path: 'products',
        data: { breadcrumb: 'Productos' },
        children: [
            { path: '', component: ProductListComponent, pathMatch: 'full' },
            { path: ':id', component: ProductDetail, data: { breadcrumb: 'Detalle del Producto' } }
        ]
    },
    { path: 'favorites', component: FavoritesComponent, data: { breadcrumb: 'Favoritos' } },
    { path: 'login', component: LoginComponent, data: { breadcrumb: 'Iniciar Sesión' } },
    { path: 'register', component: RegisterComponent, data: { breadcrumb: 'Registro' } },
    {
        path: 'admin',
        component: AdminDashboardComponent,
        canActivate: [authGuard],
        data: { breadcrumb: 'Administración' },
        children: [
            { path: '', redirectTo: 'products', pathMatch: 'full' },
            {
                path: 'products',
                data: { breadcrumb: 'Productos' },
                children: [
                    { path: '', component: ProductAdminListComponent, pathMatch: 'full' },
                    { path: 'add', component: ProductFormComponent, data: { breadcrumb: 'Agregar Producto' } },
                    { path: 'edit/:id', component: ProductFormComponent, data: { breadcrumb: 'Editar Producto' } }
                ]
            },
            { path: 'inventory/:productId', component: InventoryComponent, data: { breadcrumb: 'Inventario' } },
            { path: 'company', component: CompanyManagement, data: { breadcrumb: 'Empresa' } },
            { path: 'categories', component: CategoryManagement, data: { breadcrumb: 'Categorías' } },
            { path: 'brands', component: BrandManagement, data: { breadcrumb: 'Marcas' } },
        ]
    },
    { path: 'cart', component: CartComponent, data: { breadcrumb: 'Carrito' } },
    { path: 'checkout', component: CheckoutComponent, data: { breadcrumb: 'Checkout' } },
];
