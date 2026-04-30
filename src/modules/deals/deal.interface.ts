// import { Deal, Product } from "@/generated/prisma/client";

// export interface IGetDealsResult {
//   data: Deal[];
//   currentPage: number;
//   totalPages: number;
//   totalCount: number;
// }
// export interface ProductWithAccessibleImages extends Product {
//   accessibleImageUrls?: string[];
// }

// export type DealWithProducts = Deal & {
//   products: ProductWithAccessibleImages[];
// };

// -------------------------------- 22222222222222222222222 ---------------------------
import { Deal, Product } from "@/generated/prisma/client";

// ✅ Use string for dealId since it's serialized from BigInt
export interface IGetDealsResult {
  data: Array<Deal & { products?: Product[] }>;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export interface ProductWithAccessibleImages extends Product {
  accessibleImageUrls?: string[];
}

// ✅ Use string for dealId
export type DealWithProducts = Omit<Deal, "dealId"> & {
  dealId: string;
  products: ProductWithAccessibleImages[];
};
