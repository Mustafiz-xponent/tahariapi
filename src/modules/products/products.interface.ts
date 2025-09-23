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
  categoryId?: bigint;
}
export interface GetAllProductsResult {
  products: ProductWithAccessibleImages[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}
