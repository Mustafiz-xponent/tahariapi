// import httpStatus from "http-status";
// import { AppError } from "@/utils/appError";
// import { Deal } from "@/generated/prisma/client";
// import prisma from "@/prisma-client/prismaClient";
// import { CreateDealDto, UpdateDealDto } from "@/modules/deals/deal.dto";
// import { processProductsWithAccessibleUrls } from "@/utils/fileUpload/s3Aws";
// import {
//   DealWithProducts,
//   IGetDealsResult,
// } from "@/modules/deals/deal.interface";

// /**
//  * Creates a new deal entry in the database
//  */
// export async function createDeal(data: CreateDealDto["body"]): Promise<Deal> {
//   if (data.isGlobal) {
//     const existingGlobalDeal = await prisma.deal.findFirst({
//       where: {
//         isGlobal: true,
//         startDate: { lte: new Date() },
//         endDate: { gt: new Date() },
//       },
//     });

//     if (existingGlobalDeal) {
//       throw new AppError(
//         "An active global deal already exists.",
//         httpStatus.BAD_REQUEST,
//       );
//     }

//     return await prisma.deal.create({
//       data: {
//         title: data.title,
//         description: data.description ?? null,
//         discountType: data.discountType,
//         discountValue: data.discountValue,
//         startDate: data.startDate,
//         endDate: data.endDate,
//         isGlobal: data.isGlobal,
//       },
//     });
//   }

//   if (data?.productIds?.length === 0) {
//     throw new AppError(
//       "Please provide productIds for non-global deals.",
//       httpStatus.BAD_REQUEST,
//     );
//   }

//   const productsWithDeal = await prisma.product.findMany({
//     where: {
//       productId: { in: data.productIds },
//       deal: {
//         isGlobal: false,
//         startDate: { lte: new Date() },
//         endDate: { gt: new Date() },
//       },
//     },
//     select: { productId: true },
//   });

//   if (productsWithDeal.length > 0) {
//     const ids = productsWithDeal.map((p) => p.productId);
//     throw new AppError(
//       `These products already have active deals: ${ids.join(", ")}`,
//       httpStatus.BAD_REQUEST,
//     );
//   }

//   return await prisma.$transaction(async (tx) => {
//     const deal = await tx.deal.create({
//       data: {
//         title: data.title,
//         description: data.description ?? null,
//         discountType: data.discountType,
//         discountValue: data.discountValue,
//         startDate: data.startDate,
//         endDate: data.endDate,
//       },
//     });

//     await tx.product.updateMany({
//       where: { productId: { in: data.productIds } },
//       data: { dealId: deal.dealId },
//     });

//     return deal;
//   });
// }

// /**
//  * Retrieves all deals with pagination and filtering
//  */
// export async function getAllDeals(
//   paginationParams: { page: number; limit: number; skip: number; sort: string },
//   filterParams: { isActive?: boolean; search?: string }, // ✅ Add search
// ): Promise<IGetDealsResult> {
//   const { page, limit, skip, sort } = paginationParams;
//   const { isActive, search } = filterParams;
//   const now = new Date();

//   const whereClause: any = {};

//   // ✅ Add search filter
//   if (search && search.trim()) {
//     whereClause.OR = [
//       { title: { contains: search, mode: "insensitive" } },
//       { description: { contains: search, mode: "insensitive" } },
//     ];
//   }

//   if (typeof isActive === "boolean") {
//     if (isActive) {
//       whereClause.startDate = { lte: now };
//       whereClause.endDate = { gt: now };
//     } else {
//       whereClause.OR = [{ startDate: { gt: now } }, { endDate: { lte: now } }];
//     }
//   }

//   const deals = await prisma.deal.findMany({
//     where: whereClause,
//     include: { products: true },
//     take: limit,
//     skip: skip,
//     orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
//   });

//   const totalCount = await prisma.deal.count({ where: whereClause });

//   const processedDeals = await Promise.all(
//     deals.map(async (deal) => {
//       const processedProducts = await processProductsWithAccessibleUrls(
//         deal.products,
//         300,
//       );

//       return {
//         ...deal,
//         products: processedProducts,
//       };
//     }),
//   );

//   return {
//     data: processedDeals,
//     currentPage: page,
//     totalPages: Math.ceil(totalCount / limit),
//     totalCount,
//   };
// }

// /**
//  * Retrieves a single deal by its ID
//  */
// export async function getDealById(dealId: bigint): Promise<DealWithProducts> {
//   const deal = await prisma.deal.findUnique({
//     where: { dealId },
//     include: { products: true },
//   });

//   if (!deal) {
//     throw new AppError("Deal not found", httpStatus.NOT_FOUND);
//   }

//   const productsWithAccessibleUrls = await processProductsWithAccessibleUrls(
//     deal.products,
//     300,
//   );

//   return {
//     ...deal,
//     dealId: String(deal.dealId), // ✅ Serialize BigInt to string
//     products: productsWithAccessibleUrls,
//   };
// }

// /**
//  * Updates an existing deal by its ID
//  */
// export async function updateDeal(
//   dealId: bigint,
//   data: UpdateDealDto["body"],
// ): Promise<Deal> {
//   const existingDeal = await prisma.deal.findUnique({ where: { dealId } });

//   if (!existingDeal) {
//     throw new AppError("Deal not found", httpStatus.NOT_FOUND);
//   }

//   if (data.isGlobal) {
//     const now = new Date();
//     const otherActiveGlobalDeal = await prisma.deal.findFirst({
//       where: {
//         isGlobal: true,
//         dealId: { not: dealId },
//         startDate: { lte: now },
//         endDate: { gte: now },
//       },
//     });

//     if (otherActiveGlobalDeal) {
//       throw new AppError(
//         "Another active global deal already exists.",
//         httpStatus.BAD_REQUEST,
//       );
//     }
//   }

//   if (
//     data.isGlobal === false &&
//     (!data.productIds || data.productIds.length === 0)
//   ) {
//     throw new AppError(
//       "Please provide productIds for non-global deals.",
//       httpStatus.BAD_REQUEST,
//     );
//   }

//   if (!data.isGlobal && data.productIds?.length) {
//     const now = new Date();
//     const productsWithDeal = await prisma.product.findMany({
//       where: {
//         productId: { in: data.productIds },
//         deal: {
//           NOT: { dealId },
//           startDate: { lte: now },
//           endDate: { gte: now },
//         },
//       },
//     });

//     if (productsWithDeal.length > 0) {
//       const ids = productsWithDeal.map((p) => p.productId);
//       throw new AppError(
//         `These products already have active deals: ${ids.join(", ")}`,
//         httpStatus.BAD_REQUEST,
//       );
//     }
//   }

//   return await prisma.$transaction(async (tx) => {
//     const updatedDeal = await tx.deal.update({
//       where: { dealId },
//       data: {
//         title: data.title,
//         description: data.description,
//         discountType: data.discountType,
//         discountValue: data.discountValue,
//         startDate: data.startDate,
//         endDate: data.endDate,
//         isGlobal: data.isGlobal,
//       },
//     });

//     if (!data.isGlobal && data.productIds) {
//       await tx.product.updateMany({
//         where: { dealId },
//         data: { dealId: null },
//       });

//       await tx.product.updateMany({
//         where: { productId: { in: data.productIds } },
//         data: { dealId },
//       });
//     }

//     return updatedDeal;
//   });
// }

// /**
//  * Deletes a deal by its ID
//  */
// export async function deleteDeal(dealId: bigint): Promise<void> {
//   const deal = await prisma.deal.findUnique({ where: { dealId } });

//   if (!deal) {
//     throw new AppError("Deal not found", httpStatus.NOT_FOUND);
//   }

//   // Unassign deal from products before deleting
//   await prisma.product.updateMany({
//     where: { dealId },
//     data: { dealId: null },
//   });

//   await prisma.deal.delete({ where: { dealId } });
// }

// ------------------------------ 2222222222222222222222222222 --------------------------------
import httpStatus from "http-status";
import { AppError } from "@/utils/appError";
import { Deal } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";
import { CreateDealDto, UpdateDealDto } from "@/modules/deals/deal.dto";
import { processProductsWithAccessibleUrls } from "@/utils/fileUpload/s3Aws";
import {
  DealWithProducts,
  IGetDealsResult,
} from "@/modules/deals/deal.interface";

/**
 * Creates a new deal entry in the database
 */
export async function createDeal(data: CreateDealDto["body"]): Promise<Deal> {
  if (data.isGlobal) {
    const existingGlobalDeal = await prisma.deal.findFirst({
      where: {
        isGlobal: true,
        startDate: { lte: new Date() },
        endDate: { gt: new Date() },
      },
    });

    if (existingGlobalDeal) {
      throw new AppError(
        "An active global deal already exists.",
        httpStatus.BAD_REQUEST,
      );
    }

    return await prisma.deal.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: data.startDate,
        endDate: data.endDate,
        isGlobal: data.isGlobal,
      },
    });
  }

  if (data?.productIds?.length === 0) {
    throw new AppError(
      "Please provide productIds for non-global deals.",
      httpStatus.BAD_REQUEST,
    );
  }

  const productsWithDeal = await prisma.product.findMany({
    where: {
      productId: { in: data.productIds },
      deal: {
        isGlobal: false,
        startDate: { lte: new Date() },
        endDate: { gt: new Date() },
      },
    },
    select: { productId: true },
  });

  if (productsWithDeal.length > 0) {
    const ids = productsWithDeal.map((p) => p.productId);
    throw new AppError(
      `These products already have active deals: ${ids.join(", ")}`,
      httpStatus.BAD_REQUEST,
    );
  }

  return await prisma.$transaction(async (tx) => {
    const deal = await tx.deal.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    await tx.product.updateMany({
      where: { productId: { in: data.productIds } },
      data: { dealId: deal.dealId },
    });

    return deal;
  });
}

/**
 * Retrieves all deals with pagination and filtering
 */
export async function getAllDeals(
  paginationParams: { page: number; limit: number; skip: number; sort: string },
  filterParams: { isActive?: boolean; search?: string },
): Promise<IGetDealsResult> {
  const { page, limit, skip, sort } = paginationParams;
  const { isActive, search } = filterParams;
  const now = new Date();

  const whereClause: any = {};

  if (search && search.trim()) {
    whereClause.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (typeof isActive === "boolean") {
    if (isActive) {
      whereClause.startDate = { lte: now };
      whereClause.endDate = { gt: now };
    } else {
      whereClause.OR = [{ startDate: { gt: now } }, { endDate: { lte: now } }];
    }
  }

  const deals = await prisma.deal.findMany({
    where: whereClause,
    include: { products: true },
    take: limit,
    skip: skip,
    orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
  });

  const totalCount = await prisma.deal.count({ where: whereClause });

  const processedDeals = await Promise.all(
    deals.map(async (deal) => {
      const processedProducts = await processProductsWithAccessibleUrls(
        deal.products,
        300,
      );

      return {
        ...deal,
        products: processedProducts,
      };
    }),
  );

  return {
    data: processedDeals,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalCount,
  };
}

/**
 * Retrieves a single deal by its ID with products
 */
export async function getDealById(dealId: bigint): Promise<DealWithProducts> {
  const deal = await prisma.deal.findUnique({
    where: { dealId },
    include: {
      products: true, // ✅ Get full product data
    },
  });

  if (!deal) {
    throw new AppError("Deal not found", httpStatus.NOT_FOUND);
  }

  // ✅ Process products with accessible URLs
  const productsWithAccessibleUrls = await processProductsWithAccessibleUrls(
    deal.products,
    300,
  );

  return {
    ...deal,
    dealId: String(deal.dealId),
    products: productsWithAccessibleUrls, // ✅ Return full product objects
  };
}

/**
 * Updates an existing deal by its ID
 */
export async function updateDeal(
  dealId: bigint,
  data: UpdateDealDto["body"],
): Promise<Deal> {
  const existingDeal = await prisma.deal.findUnique({ where: { dealId } });

  if (!existingDeal) {
    throw new AppError("Deal not found", httpStatus.NOT_FOUND);
  }

  if (data.isGlobal) {
    const now = new Date();
    const otherActiveGlobalDeal = await prisma.deal.findFirst({
      where: {
        isGlobal: true,
        dealId: { not: dealId },
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (otherActiveGlobalDeal) {
      throw new AppError(
        "Another active global deal already exists.",
        httpStatus.BAD_REQUEST,
      );
    }
  }

  if (
    data.isGlobal === false &&
    (!data.productIds || data.productIds.length === 0)
  ) {
    throw new AppError(
      "Please provide productIds for non-global deals.",
      httpStatus.BAD_REQUEST,
    );
  }

  if (!data.isGlobal && data.productIds?.length) {
    const now = new Date();
    const productsWithDeal = await prisma.product.findMany({
      where: {
        productId: { in: data.productIds },
        deal: {
          NOT: { dealId },
          startDate: { lte: now },
          endDate: { gte: now },
        },
      },
    });

    if (productsWithDeal.length > 0) {
      const ids = productsWithDeal.map((p) => p.productId);
      throw new AppError(
        `These products already have active deals: ${ids.join(", ")}`,
        httpStatus.BAD_REQUEST,
      );
    }
  }

  return await prisma.$transaction(async (tx) => {
    const updatedDeal = await tx.deal.update({
      where: { dealId },
      data: {
        title: data.title,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: data.startDate,
        endDate: data.endDate,
        isGlobal: data.isGlobal,
      },
    });

    if (!data.isGlobal && data.productIds) {
      await tx.product.updateMany({
        where: { dealId },
        data: { dealId: null },
      });

      await tx.product.updateMany({
        where: { productId: { in: data.productIds } },
        data: { dealId },
      });
    }

    return updatedDeal;
  });
}

/**
 * Deletes a deal by its ID
 */
export async function deleteDeal(dealId: bigint): Promise<void> {
  const deal = await prisma.deal.findUnique({ where: { dealId } });

  if (!deal) {
    throw new AppError("Deal not found", httpStatus.NOT_FOUND);
  }

  await prisma.product.updateMany({
    where: { dealId },
    data: { dealId: null },
  });

  await prisma.deal.delete({ where: { dealId } });
}
