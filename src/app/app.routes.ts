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

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'products', component: ProductListComponent },
    { path: 'products/:id', component: ProductDetail }, // New route
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'admin',
        component: AdminDashboardComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'products', pathMatch: 'full' },
            { path: 'products', component: ProductAdminListComponent },
            { path: 'add-product', component: ProductFormComponent },
            { path: 'edit-product/:id', component: ProductFormComponent },
            { path: 'inventory/:productId', component: InventoryComponent },
            { path: 'company', component: CompanyManagement },
            { path: 'categories', component: CategoryManagement },
            { path: 'brands', component: BrandManagement },
        ]
    },
    { path: 'cart', component: CartComponent },
    { path: 'checkout', component: CheckoutComponent },
];
