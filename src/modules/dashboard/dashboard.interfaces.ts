import { Order } from "@/generated/prisma/client";

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
  recentOrders: Order[];
}
export interface salesOverviewResult {
  data: number[];
  labels: string[];
  year: number;
}
