import { Category } from "@/generated/prisma/client";
import { GetCategoriesDto } from "@/modules/categories/category.dto";

export interface GetCategoryResult extends Category {
  accessibleImageUrl?: string | null;
}
export type GetCategoriesQueryOptions = GetCategoriesDto["query"] & {
  skip: number;
};

export interface GetCategoriesResult {
  data: GetCategoryResult[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}
