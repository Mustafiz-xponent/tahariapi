import { Order, ProductUnitType } from "@/generated/prisma/client";

interface LowStockProducts {
  productId: number;
  name: string;
  stockQuantity: number;
  reorderLevel: number;
  farmerId: number;
  farmName: string;
  unitType: ProductUnitType;
}
type RecentOrders = Omit<
  Order,
  | "shippingAddress"
  | "preorderDeliveryDate"
  | "createdAt"
  | "updatedAt"
  | "customerId"
> & {
  customer: {
    customerId: bigint;
    userId: bigint;
    user: {
      name: string | null;
    };
  };
};
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
  recentOrders: RecentOrders[];
  lowStockProducts: LowStockProducts[];
}
export interface salesOverviewResult {
  data: number[];
  labels: string[];
  year: number;
}
