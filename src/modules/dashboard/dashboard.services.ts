import prisma from "@/prisma-client/prismaClient";
import { endOfYear, startOfYear, subDays, startOfDay } from "date-fns";
import { GetSalesOverviewDto } from "@/modules/dashboard/dashboard.dto";
import {
  DashboardSummaryResult,
  SalesOverviewResult,
} from "@/modules/dashboard/dashboard.interfaces";
import {
  OrderStatus,
  PaymentStatus,
  ProductUnitType,
  SubscriptionStatus,
} from "@/generated/prisma/client";
import { AppError } from "@/utils/appError";
import httpStatus from "http-status";

// Service function
export const getDashboardSummary =
  async (): Promise<DashboardSummaryResult> => {
    const currentDayStart = startOfDay(new Date()); // Start of the current day (midnight)
    const recent30DaysStart = subDays(currentDayStart, 30); // Start of the day 30 days ago
    const previous30DaysStart = subDays(recent30DaysStart, 30); // Start of the day 60 days ago (previous 30-day period)o

    const [counts, revenueData, recentOrders, lowStockProducts] =
      await Promise.all([
        prisma.$transaction([
          // Count total products
          prisma.product.count(),
          // Count total Delivered orders
          prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
          // Count total customers
          prisma.customer.count(),
          // Count total active subscriptions
          prisma.subscription.count({
            where: { status: SubscriptionStatus.ACTIVE },
          }),
          // Count total products in the recent 30 days
          prisma.product.count({
            where: {
              createdAt: { gte: recent30DaysStart, lte: currentDayStart },
            },
          }),
          // Count total products in the previous 30 days
          prisma.product.count({
            where: {
              createdAt: { gte: previous30DaysStart, lt: recent30DaysStart },
            },
          }),
          // Count total Delivered orders in the recent 30 days
          prisma.order.count({
            where: {
              status: OrderStatus.DELIVERED,
              createdAt: { gte: recent30DaysStart, lte: currentDayStart },
            },
          }),
          // Count total Delivered orders in the previous 30 days
          prisma.order.count({
            where: {
              status: OrderStatus.DELIVERED,
              createdAt: { gte: previous30DaysStart, lt: recent30DaysStart },
            },
          }),
          // Count total customers in the recent 30 days
          prisma.customer.count({
            where: {
              user: {
                createdAt: { gte: recent30DaysStart, lte: currentDayStart },
              },
            },
          }),
          // Count total customers in the previous 30 days
          prisma.customer.count({
            where: {
              user: {
                createdAt: { gte: previous30DaysStart, lt: recent30DaysStart },
              },
            },
          }),
          // Count total active subscriptions in the recent 30 days
          prisma.subscription.count({
            where: {
              status: SubscriptionStatus.ACTIVE,
              createdAt: { gte: recent30DaysStart, lte: currentDayStart },
            },
          }),
          // Count total active subscriptions in the previous 30 days
          prisma.subscription.count({
            where: {
              status: SubscriptionStatus.ACTIVE,
              createdAt: { gte: previous30DaysStart, lt: recent30DaysStart },
            },
          }),
        ]),
        prisma.$transaction([
          // Sum total revenue
          prisma.order.aggregate({
            where: { paymentStatus: PaymentStatus.COMPLETED },
            _sum: { totalAmount: true },
          }),
          // Sum total revenue in the recent 30 days
          prisma.order.aggregate({
            where: {
              paymentStatus: PaymentStatus.COMPLETED,
              createdAt: { gte: recent30DaysStart, lte: currentDayStart },
            },
            _sum: { totalAmount: true },
          }),
          // Sum total revenue in the previous 30 days
          prisma.order.aggregate({
            where: {
              paymentStatus: PaymentStatus.COMPLETED,
              createdAt: { gte: previous30DaysStart, lt: recent30DaysStart },
            },
            _sum: { totalAmount: true },
          }),
        ]),
        // Recent orders
        prisma.order.findMany({
          include: {
            customer: { include: { user: { select: { name: true } } } },
          },
          omit: {
            shippingAddress: true,
            createdAt: true,
            updatedAt: true,
            customerId: true,
            preorderDeliveryDate: true,
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
        // Low stock products
        prisma.$queryRaw<
          {
            productId: number;
            name: string;
            stockQuantity: number;
            reorderLevel: number;
            unitType: ProductUnitType;
            createdAt: Date;
            farmerId: number;
            farmName: string;
          }[]
        >`
      SELECT 
        p."productId",
        p."name",
        p."stockQuantity",
        p."reorderLevel",
        p."unitType",
        p."createdAt",
        f."farmerId",
        f."farmName"
      FROM "Product" p
      JOIN "Farmer" f ON p."farmerId" = f."farmerId"
      WHERE p."stockQuantity" < p."reorderLevel"
      ORDER BY p."createdAt" DESC
      LIMIT 3
    `,
      ]);

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      totalActiveSubscriptions,
      recent30DaysTotalProducts,
      previous30DaysTotalProducts,
      recent30DaysTotalOrders,
      previous30DaysTotalOrders,
      recent30DaysTotalCustomers,
      previous30DaysTotalCustomers,
      recent30DaysActiveSubscriptions,
      previous30DaysActiveSubscriptions,
    ] = counts;

    const [totalRevenue, recent30DaysRevenue, previous30DaysRevenue] =
      revenueData;

    // Helper for calculating % change
    const calcChange = (current: number, prev: number) =>
      prev > 0 ? Number((((current - prev) / prev) * 100).toFixed(2)) : 0;

    // Pre-calculate revenue sums
    const recent30DaysRevenueSum =
      recent30DaysRevenue._sum.totalAmount?.toNumber() || 0;
    const previous30DaysRevenueSum =
      previous30DaysRevenue._sum.totalAmount?.toNumber() || 0;

    return {
      product: {
        totalProducts,
        changePercentage: calcChange(
          recent30DaysTotalProducts,
          previous30DaysTotalProducts
        ),
        changeLabel: "Last 30 days",
      },
      order: {
        totalOrders,
        changePercentage: calcChange(
          recent30DaysTotalOrders,
          previous30DaysTotalOrders
        ),
        changeLabel: "Last 30 days",
      },
      customer: {
        totalCustomers,
        changePercentage: calcChange(
          recent30DaysTotalCustomers,
          previous30DaysTotalCustomers
        ),
        changeLabel: "Last 30 days",
      },
      revenue: {
        totalRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0,
        changePercentage: calcChange(
          recent30DaysRevenueSum,
          previous30DaysRevenueSum
        ),
        changeLabel: "Last 30 days",
      },
      subscription: {
        totalActiveSubscriptions,
        changePercentage: calcChange(
          recent30DaysActiveSubscriptions,
          previous30DaysActiveSubscriptions
        ),
        changeLabel: "Last 30 days",
      },
      recentOrders,
      lowStockProducts,
    };
  };

/**
 * Retrieves sales overview for a given year.
 * @param {GetSalesOverviewDto["query"]["year"]} year - The year for which to retrieve sales overview.
 * @returns {Promise<{labels: string[], data: number[], year: number}>} - An object containing labels for months and sales data for each month.
 */
export const getSalesOverview = async (
  year: GetSalesOverviewDto["query"]["year"]
): Promise<SalesOverviewResult> => {
  const orderDate = await prisma.order.aggregate({
    _min: { orderDate: true },
  });

  const minYear = orderDate._min.orderDate?.getFullYear() ?? null;

  if (minYear === null) {
    throw new AppError(
      "No orders found to determine year range",
      httpStatus.NOT_FOUND
    );
  }

  if (year < minYear || year > new Date().getFullYear()) {
    throw new AppError("Invalid year", httpStatus.BAD_REQUEST);
  }
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
    meta: {
      yearRange: {
        min: minYear,
        max: new Date().getFullYear(),
      },
    },
  };
};
