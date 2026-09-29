import { Component, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { ApiService } from "../../../core/services/api.service";
import {
  LucideAngularModule,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
} from "lucide-angular";

interface DashboardMetric {
  label: string;
  value: number | string;
  change: number;
  icon: any;
  color: string;
}

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, LucideAngularModule, HttpClientModule],
  templateUrl: "./admin-dashboard.component.html",
  styleUrls: ["./admin-dashboard.component.css"],
})
export class AdminDashboardComponent implements OnInit {
  Math = Math;
  api = inject(ApiService);
  private router = inject(Router);

  metrics: DashboardMetric[] = [];
  topProducts: any[] = [];
  recentOrders: any[] = [];
  lowStockAlerts: any[] = [];

  private refreshIntervalId: any = null;

  DollarSign = DollarSign;
  ShoppingCart = ShoppingCart;
  Package = Package;
  Users = Users;

  ngOnInit(): void {
    this.loadDashboardData();
    // Poll every 30 seconds for near-real-time updates
    this.refreshIntervalId = setInterval(() => this.loadDashboardData(), 30000);
  }

  viewAlerts(): void {
    // Navigate to admin products with an alerts filter query param
    this.router.navigate(["/admin/products"], { queryParams: { alerts: "1" } });
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId) clearInterval(this.refreshIntervalId);
  }

  loadDashboardData(): void {
    // Initialize total stock to 0, will update asynchronously
    let totalStock = 0;

    // Initialize metrics with skeleton data
    this.metrics = [
      {
        label: "Ingresos Totales",
        value: "$0",
        change: 0,
        icon: this.DollarSign,
        color: "bg-gradient-to-br from-green-400 to-green-600",
      },
      {
        label: "Órdenes Este Mes",
        value: "0",
        change: 0,
        icon: this.ShoppingCart,
        color: "bg-gradient-to-br from-blue-400 to-blue-600",
      },
      {
        label: "Productos en Stock",
        value: "0",
        change: 0,
        icon: this.Package,
        color: "bg-gradient-to-br from-red-400 to-red-600",
      },
      {
        label: "Clientes Activos",
        value: "0",
        change: 0,
        icon: this.Users,
        color: "bg-gradient-to-br from-purple-400 to-purple-600",
      },
    ];

    // Fetch recent orders from backend
    this.api.get<any>("/sales/").subscribe({
      next: (sales) => {
        const salesList = sales.results || sales;
        this.recentOrders = salesList.slice(0, 5).map((sale: any) => ({
          id: sale.id,
          customer: sale.customer?.name || "Consumidor Final",
          total: sale.total,
          status: sale.shipping_status === 'SHIPPED' ? 'entregado' : 'pendiente',
          date: new Date(sale.created_at).toISOString().split("T")[0],
        }));
      },
      error: (err) => console.error("Error loading recent orders", err),
    });

    // Fetch dashboard summary from backend for real data
    this.api.get<any>("/dashboard/summary").subscribe({
      next: (summary) => {
        // Update metrics values
        this.metrics[0].value = `$${Math.round(summary.sales_today || 0).toLocaleString("es-AR")}`;
        this.metrics[1].value = (summary.orders_today || 0).toString();
        // products count will be fetched separately
        this.metrics[3].value = (summary.new_customers || 0).toString();

      },
      error: (err) => console.error("Error loading dashboard summary", err),
    });

    // Fetch top products from backend
    this.api.get<any>("/dashboard/top_products/").subscribe({
      next: (top) => {
        // API returns array of { product__name, product__sku, total_sold }
        this.topProducts = (top || []).map((t: any) => ({
          name: t.product__name || t.name || t.name,
          sales: t.total_sold || t.sales || 0,
        }));
      },
      error: (err) => console.error("Error loading top products", err),
    });

    // Fetch recent revenue stats for the activity chart (non-blocking)
    this.api.get<any>("/dashboard/revenue_stats/").subscribe({
      next: (series) => {
        // TODO: integrate with chart component when available
      },
      error: () => {},
    });

    // Fetch low-stock alerts
    this.api.get<any>("/products/alerts/").subscribe({
      next: (alerts) => {
        this.lowStockAlerts = alerts || [];
      },
      error: (err) => console.error("Error loading product alerts", err),
    });
  }
}
