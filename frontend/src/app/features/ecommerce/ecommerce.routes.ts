// Rutas del e-commerce público: tienda, carrito, checkout y pedidos
// Parte de compra en línea accesible al público
import { Routes } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { CartComponent } from "./cart/cart.component";
import { ProductDetailComponent } from "./product-detail/product-detail.component";
import { CheckoutResultComponent } from "./checkout-result/checkout-result.component";
import { CheckoutComponent } from "./checkout/checkout.component";

export const ECOMMERCE_ROUTES: Routes = [
  { path: "", component: HomeComponent },
  { path: "product/:id", component: ProductDetailComponent },
  { path: "cart", component: CartComponent },
  { path: "checkout", component: CheckoutComponent },
  { path: "checkout/success", component: CheckoutResultComponent },
  { path: "checkout/failure", component: CheckoutResultComponent },
  { path: "checkout/pending", component: CheckoutResultComponent },
];
