// import { Customer } from "@/generated/prisma/client";

// export interface GetAllCusotmersResult {
//   customers: Customer[];
//   currentPage: number;
//   totalPages: number;
//   totalCount: number;
//   totalUnreadMessageCount: number;
// }
// export interface GetAllCustomersPaginationParams {
//   page: number;
//   limit: number;
//   skip: number;
//   sort: string;
// }

// -------------------------------- 22222222222222222222222 ---------------------------
export interface RawCustomerRow {
  customerId: bigint;
  userId: bigint;
  name: string | null;
  email: string | null;
  phone: string;
  lastMessageId: bigint | null;
  lastMessage: string | null;
  lastMessageCreatedAt: Date | null;
  unreadMessageCount: number;
}

export interface SerializedCustomer {
  customerId: string;
  userId: string;
  name: string | null;
  email: string | null;
  phone: string;
  lastMessageId: string | null;
  lastMessage: string | null;
  lastMessageCreatedAt: string | null;
  unreadMessageCount: number;
}

export interface GetAllCusotmersResult {
  customers: SerializedCustomer[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  totalUnreadMessageCount: number;
}

export interface GetAllCustomersPaginationParams {
  page: number;
  limit: number;
  skip: number;
  sort: string;
}
