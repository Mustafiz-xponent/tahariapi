import { Farmer } from "@/generated/prisma/client";
export interface GetAllFarmersResult {
  data: Farmer[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}
