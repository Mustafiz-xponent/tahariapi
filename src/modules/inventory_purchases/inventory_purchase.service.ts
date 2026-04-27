// // src/modules/inventory_purchases/inventory_purchase.service.ts
// /**
//  * Service layer for InventoryPurchase entity operations.
//  * Contains business logic and database interactions for inventory purchases.
//  */
// import prisma from "@/prisma-client/prismaClient";
// import { getErrorMessage } from "@/utils/errorHandler";
// import { InventoryPurchase } from "@/generated/prisma/client";
// import {
//   CreateInventoryPurchaseDto,
//   UpdateInventoryPurchaseDto,
// } from "@/modules/inventory_purchases/inventory-purchase.dto";

// /**
//  * Create a new inventory purchase
//  * @param data - Data required to create an inventory purchase
//  * @returns The created inventory purchase
//  * @throws Error if the inventory purchase cannot be created (e.g., invalid foreign keys)
//  */
// export async function createInventoryPurchase(
//   data: CreateInventoryPurchaseDto
// ): Promise<InventoryPurchase> {
//   try {
//     const inventoryPurchase = await prisma.inventoryPurchase.create({
//       data: {
//         quantity: data.quantity,
//         unitCost: data.unitCost,
//         totalCost: data.totalCost,
//         purchaseDate: data.purchaseDate ?? new Date(),
//         status: data.status ?? "PENDING",
//         notes: data.notes,
//         farmerId: data.farmerId,
//         productId: data.productId,
//       },
//     });
//     return inventoryPurchase;
//   } catch (error) {
//     throw new Error(
//       `Failed to create inventory purchase: ${getErrorMessage(error)}`
//     );
//   }
// }

// /**
//  * Retrieve all inventory purchases
//  * @returns An array of all inventory purchases
//  * @throws Error if the query fails
//  */
// export async function getAllInventoryPurchases(): Promise<InventoryPurchase[]> {
//   try {
//     const inventoryPurchases = await prisma.inventoryPurchase.findMany();
//     return inventoryPurchases;
//   } catch (error) {
//     throw new Error(
//       `Failed to fetch inventory purchases: ${getErrorMessage(error)}`
//     );
//   }
// }

// /**
//  * Retrieve an inventory purchase by its ID
//  * @param purchaseId - The ID of the inventory purchase
//  * @returns The inventory purchase if found, or null if not found
//  * @throws Error if the query fails
//  */
// export async function getInventoryPurchaseById(
//   purchaseId: BigInt
// ): Promise<InventoryPurchase | null> {
//   try {
//     const inventoryPurchase = await prisma.inventoryPurchase.findUnique({
//       where: { purchaseId: Number(purchaseId) },
//     });
//     return inventoryPurchase;
//   } catch (error) {
//     throw new Error(
//       `Failed to fetch inventory purchase: ${getErrorMessage(error)}`
//     );
//   }
// }

// /**
//  * Update an inventory purchase by its ID
//  * @param purchaseId - The ID of the inventory purchase to update
//  * @param data - Data to update the inventory purchase
//  * @returns The updated inventory purchase
//  * @throws Error if the inventory purchase is not found or update fails
//  */
// export async function updateInventoryPurchase(
//   purchaseId: BigInt,
//   data: UpdateInventoryPurchaseDto
// ): Promise<InventoryPurchase> {
//   try {
//     const inventoryPurchase = await prisma.inventoryPurchase.update({
//       where: { purchaseId: Number(purchaseId) },
//       data: {
//         quantity: data.quantity,
//         unitCost: data.unitCost,
//         totalCost: data.totalCost,
//         purchaseDate: data.purchaseDate,
//         status: data.status,
//         notes: data.notes,
//         farmerId: data.farmerId,
//         productId: data.productId,
//       },
//     });
//     return inventoryPurchase;
//   } catch (error) {
//     throw new Error(
//       `Failed to update inventory purchase: ${getErrorMessage(error)}`
//     );
//   }
// }

// /**
//  * Delete an inventory purchase by its ID
//  * @param purchaseId - The ID of the inventory purchase to delete
//  * @throws Error if the inventory purchase is not found or deletion fails
//  */
// export async function deleteInventoryPurchase(
//   purchaseId: BigInt
// ): Promise<void> {
//   try {
//     await prisma.inventoryPurchase.delete({
//       where: { purchaseId: Number(purchaseId) },
//     });
//   } catch (error) {
//     throw new Error(
//       `Failed to delete inventory purchase: ${getErrorMessage(error)}`
//     );
//   }
// }


// ----------------------------- 22222222222222222222222222222 ---------------------------------
import prisma from "@/prisma-client/prismaClient";
import { getErrorMessage } from "@/utils/errorHandler";
import { InventoryPurchase } from "@/generated/prisma/client";
import {
  CreateInventoryPurchaseDto,
  UpdateInventoryPurchaseDto,
} from "@/modules/inventory_purchases/inventory-purchase.dto";

// ✅ Exact shape matching IPagination interface
interface PaginationShape {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginatedResult {
  data: InventoryPurchase[];
  pagination: PaginationShape;
}

const includeRelations = {
  farmer: {
    select: {
      farmerId: true,
      name: true,
      farmName: true,
      contactInfo: true,
    },
  },
  product: {
    select: {
      productId: true,
      name: true,
      description: true,
    },
  },
};

export async function createInventoryPurchase(
  data: CreateInventoryPurchaseDto
): Promise<InventoryPurchase> {
  try {
    const inventoryPurchase = await prisma.inventoryPurchase.create({
      data: {
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost: data.totalCost,
        purchaseDate: data.purchaseDate ?? new Date(),
        status: data.status ?? "PENDING",
        notes: data.notes,
        farmerId: data.farmerId,
        productId: data.productId,
      },
      include: includeRelations,
    });
    return inventoryPurchase;
  } catch (error) {
    throw new Error(
      `Failed to create inventory purchase: ${getErrorMessage(error)}`
    );
  }
}

export async function getAllInventoryPurchases(
  params: { search?: string; limit?: number; page?: number } = {}
): Promise<PaginatedResult> {
  try {
    const { search = "", limit = 10, page = 1 } = params;
    const take = Number(limit);
    const currentPage = Number(page);
    const skip = (currentPage - 1) * take;

    const where = search
      ? {
          OR: [
            {
              product: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              farmer: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              notes: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {};

    const [inventoryPurchases, totalItems] = await Promise.all([
      prisma.inventoryPurchase.findMany({
        where,
        include: includeRelations,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.inventoryPurchase.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / take);

    // ✅ Returns exact IPagination shape
    const pagination: PaginationShape = {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: take,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };

    return { data: inventoryPurchases, pagination };
  } catch (error) {
    throw new Error(
      `Failed to fetch inventory purchases: ${getErrorMessage(error)}`
    );
  }
}

export async function getInventoryPurchaseById(
  purchaseId: bigint
): Promise<InventoryPurchase | null> {
  try {
    const inventoryPurchase = await prisma.inventoryPurchase.findUnique({
      where: { purchaseId: Number(purchaseId) },
      include: includeRelations,
    });
    return inventoryPurchase;
  } catch (error) {
    throw new Error(
      `Failed to fetch inventory purchase: ${getErrorMessage(error)}`
    );
  }
}

export async function updateInventoryPurchase(
  purchaseId: bigint,
  data: UpdateInventoryPurchaseDto
): Promise<InventoryPurchase> {
  try {
    const inventoryPurchase = await prisma.inventoryPurchase.update({
      where: { purchaseId: Number(purchaseId) },
      data: {
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost: data.totalCost,
        purchaseDate: data.purchaseDate,
        status: data.status,
        notes: data.notes,
        farmerId: data.farmerId,
        productId: data.productId,
      },
      include: includeRelations,
    });
    return inventoryPurchase;
  } catch (error) {
    throw new Error(
      `Failed to update inventory purchase: ${getErrorMessage(error)}`
    );
  }
}

export async function deleteInventoryPurchase(purchaseId: bigint): Promise<void> {
  try {
    await prisma.inventoryPurchase.delete({
      where: { purchaseId: Number(purchaseId) },
    });
  } catch (error) {
    throw new Error(
      `Failed to delete inventory purchase: ${getErrorMessage(error)}`
    );
  }
}