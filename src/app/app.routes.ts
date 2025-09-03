import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { ProductListComponent } from './components/product-list/product-list';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { AdminPanel } from './components/admin-panel/admin-panel';

import { authGuard } from './services/auth-guard';

import { ProductFormComponent } from './components/product-form/product-form';

import { CartComponent } from './components/cart/cart';
import { CheckoutComponent } from './components/checkout/checkout';

import { InventoryComponent } from './components/inventory/inventory';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'products', component: ProductListComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'admin', component: AdminPanel, canActivate: [authGuard] },
    { path: 'admin/add-product', component: ProductFormComponent, canActivate: [authGuard] },
    { path: 'admin/edit-product/:id', component: ProductFormComponent, canActivate: [authGuard] },
    { path: 'admin/inventory/:productId', component: InventoryComponent, canActivate: [authGuard] },
    { path: 'cart', component: CartComponent },
    { path: 'checkout', component: CheckoutComponent },
];
