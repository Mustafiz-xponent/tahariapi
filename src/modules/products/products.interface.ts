import { Product } from "@/generated/prisma/client";
export interface ProductWithAccessibleImages
  extends Omit<Product, "imageUrls"> {
  imageUrls: string[];
  accessibleImageUrls?: string[];
}

export interface GetAllProductsPaginationOptions {
  page: number;
  limit: number;
  skip: number;
  sort: string;
}
export interface GetAllProductsFilterOptions {
  isSubscription?: boolean;
  isPreorder?: boolean;
  name?: string;
  categoryIds?: bigint[];
  farmerIds?: bigint[];
  status?: "in-stock" | "out-of-stock" | "low-stock";
}
export interface GetAllProductsResult {
  products: ProductWithAccessibleImages[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}
