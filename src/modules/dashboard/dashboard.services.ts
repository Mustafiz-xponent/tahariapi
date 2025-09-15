import prisma from "@/prisma-client/prismaClient";
import { endOfYear, startOfYear, subDays, startOfDay } from "date-fns";
import { GetSalesOverviewDto } from "@/modules/dashboard/dashboard.dto";
import { DashboardSummaryResult } from "@/modules/dashboard/dashboard.interfaces";
import {
  OrderStatus,
  PaymentStatus,
  Product,
  SubscriptionStatus,
} from "@/generated/prisma/client";

// Service function
export const getDashboardSummary =
  async (): Promise<DashboardSummaryResult> => {
    const currentDayStart = startOfDay(new Date()); // Start of the current day (midnight)
    const recent30DaysStart = subDays(currentDayStart, 30); // Start of the day 30 days ago
    const previous30DaysStart = subDays(recent30DaysStart, 30); // Start of the day 60 days ago (previous 30-day period)o

    const [
      totalProducts,
      totalOrders,
      totalRevenue,
      totalCustomers,
      recentOrders,
      recent30DaysRevenue,
      previous30DaysRevenue,
      recent30DaysTotalProducts,
      previous30DaysTotalProducts,
      recent30DaysTotalOrders,
      previous30DaysTotalOrders,
      recent30DaysTotalCustomers,
      previous30DaysTotalCustomers,
      recent30DaysActiveSubscriptions,
      previous30DaysActiveSubscriptions,
      totalActiveSubscriptions,
    ] = await Promise.all([
      // 1. Count total products
      prisma.product.count(),

      // 2. Count delivered orders
      prisma.order.count({
        where: {
          status: { in: [OrderStatus.DELIVERED] },
        },
      }),

      // 3. Sum of completed payment amounts
      prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.COMPLETED },
        _sum: { totalAmount: true },
      }),

      // 4. Count total customers
      prisma.customer.count(),

      // 5. Get recent 5 orders
      prisma.order.findMany({
        include: {
          customer: { include: { user: { select: { name: true } } } },
        },
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
      }),
      // 6. Sum of last 30 days Revenue
      prisma.order.aggregate({
        where: {
          paymentStatus: PaymentStatus.COMPLETED,
          createdAt: { gte: recent30DaysStart, lte: currentDayStart },
        },
        _sum: { totalAmount: true },
      }),

      // 7. Sum of previous 30 days Revenue
      prisma.order.aggregate({
        where: {
          paymentStatus: "COMPLETED",
          createdAt: { gte: previous30DaysStart, lt: recent30DaysStart },
        },
        _sum: { totalAmount: true },
      }),

      // 8. Recent 30 days products count
      prisma.product.count({
        where: { createdAt: { gte: recent30DaysStart, lte: currentDayStart } },
      }),

      // 9. Previous 30 days products count
      prisma.product.count({
        where: {
          createdAt: { gte: previous30DaysStart, lt: recent30DaysStart },
        },
      }),

      // 10. Recent 30 days orders count
      prisma.order.count({
        where: {
          status: { in: [OrderStatus.DELIVERED] },
          createdAt: { gte: recent30DaysStart, lte: currentDayStart },
        },
      }),

      // 11. Previous 30 days orders count
      prisma.order.count({
        where: {
          status: { in: [OrderStatus.DELIVERED] },
          createdAt: { gte: previous30DaysStart, lt: recent30DaysStart },
        },
      }),

      // 12. Recent 30 days customers count
      prisma.customer.count({
        where: {
          user: {
            createdAt: { gte: recent30DaysStart, lte: currentDayStart },
          },
        },
      }),

      // 13. Previous 30 days customers count
      prisma.customer.count({
        where: {
          user: {
            createdAt: { gte: previous30DaysStart, lt: recent30DaysStart },
          },
        },
      }),
      // 14. Recent 30 days customers count
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          createdAt: { gte: recent30DaysStart, lte: currentDayStart },
        },
      }),

      // 15. Previous 30 days customers count
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          createdAt: { gte: previous30DaysStart, lt: recent30DaysStart },
        },
      }),
      // 16. Total active subscriptions
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
        },
      }),
    ]);

    const lowStockProducts = await prisma.$queryRaw<
      {
        productId: number;
        name: string;
        stockQuantity: number;
        reorderLevel: number;
        createdAt: Date;
        farmerId: number;
        farmerName: string;
      }[]
    >`
  SELECT 
    p."productId",
    p."name",
    p."stockQuantity",
    p."reorderLevel",
    p."createdAt",
    f."farmerId",
    f."name" as "farmerName"
  FROM "Product" p
  JOIN "Farmer" f ON p."farmerId" = f."farmerId"
  WHERE p."stockQuantity" < p."reorderLevel"
  ORDER BY p."createdAt" DESC
  LIMIT 3
`;

    // Helper for calculating % change
    const calcChange = (current: number, prev: number) =>
      prev > 0 ? ((current - prev) / prev) * 100 : 0;

    const recent30DaysRevenueSum =
      recent30DaysRevenue._sum.totalAmount?.toNumber() || 0;
    const previous30DaysRevenueSum =
      previous30DaysRevenue._sum.totalAmount?.toNumber() || 0;

    return {
      product: {
        totalProducts,
        changePercentage: parseFloat(
          calcChange(
            recent30DaysTotalProducts,
            previous30DaysTotalProducts
          ).toFixed(2)
        ),
        changeLabel: `Last 30 days`,
      },
      order: {
        totalOrders,
        changePercentage: parseFloat(
          calcChange(
            recent30DaysTotalOrders,
            previous30DaysTotalOrders
          ).toFixed(2)
        ),
        changeLabel: `Last 30 days`,
      },
      customer: {
        totalCustomers,
        changePercentage: parseFloat(
          calcChange(
            recent30DaysTotalCustomers,
            previous30DaysTotalCustomers
          ).toFixed(2)
        ),
        changeLabel: `Last 30 days`,
      },
      revenue: {
        totalRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0,
        changePercentage: parseFloat(
          calcChange(recent30DaysRevenueSum, previous30DaysRevenueSum).toFixed(
            2
          )
        ),
        changeLabel: `Last 30 days`,
      },
      subscription: {
        totalActiveSubscriptions,
        changePercentage: parseFloat(
          calcChange(
            recent30DaysActiveSubscriptions,
            previous30DaysActiveSubscriptions
          ).toFixed(2)
        ),
        changeLabel: `Last 30 days`,
      },
      recentOrders,
      lowStockProducts,
    };
  };

export const getSalesOverview = async (
  year: GetSalesOverviewDto["query"]["year"]
) => {
  const orderSum = await prisma.order.groupBy({
    by: ["createdAt"],
    where: {
      paymentStatus: PaymentStatus.COMPLETED, // Only successful payments
      createdAt: {
        gte: startOfYear(new Date(year, 0, 1)),
        lte: endOfYear(new Date(year, 11, 31)),
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  // Transform grouped data into monthly buckets
  const revenueByMonth = Array(12).fill(0);

  orderSum.forEach((order) => {
    const month = new Date(order.createdAt).getMonth(); // 0–11
    revenueByMonth[month] += Number(order._sum.totalAmount ?? 0);
  });

  return {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    data: revenueByMonth,
    year,
  };
};
