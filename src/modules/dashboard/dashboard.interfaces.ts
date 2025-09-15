import { Order, Product } from "@/generated/prisma/client";

// type lowStockProducts = Pick<Product, "productId" | "name" | "quantity">

export interface DashboardSummaryResult {
  product: {
    totalProducts: number;
    changePercentage: number;
    changeLabel: string;
  };
  order: {
    totalOrders: number;
    changePercentage: number;
    changeLabel: string;
  };
  customer: {
    totalCustomers: number;
    changePercentage: number;
    changeLabel: string;
  };
  revenue: {
    totalRevenue: number;
    changePercentage: number;
    changeLabel: string;
  };
  subscription: {
    totalActiveSubscriptions: number;
    changePercentage: number;
    changeLabel: string;
  };
  recentOrders: Order[];
  lowStockProducts: Product[];
}
export interface salesOverviewResult {
  data: number[];
  labels: string[];
  year: number;
}
