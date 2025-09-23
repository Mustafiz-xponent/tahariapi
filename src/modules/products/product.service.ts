/**
 * Service layer for Product entity operations.
 */
import logger from "@/utils/logger";
import prisma from "@/prisma-client/prismaClient";
import { Prisma, Product } from "@/generated/prisma/client";
import {
  CreateProductDto,
  UpdateProductDto,
} from "@/modules/products/product.dto";
import {
  calculateDealPricing,
  DealPricingResult,
} from "@/utils/calculateDealPricing";
import {
  deleteMultipleFilesFromS3,
  extractS3KeyFromUrl,
  getBatchAccessibleImageUrls,
  processProductsWithAccessibleUrls,
  replaceProductImages,
  uploadProductImages,
} from "@/utils/fileUpload/s3Aws";
import { AppError } from "@/utils/appError";
import httpStatus from "http-status";
import {
  GetAllProductsFilterOptions,
  GetAllProductsPaginationOptions,
  GetAllProductsResult,
  ProductWithAccessibleImages,
} from "@/modules/products/products.interface";

/**
 * Create a new product with optional image uploads
 * @param data - Data required to create a product
 * @param imageFiles - Optional array of image files to upload
 * @param usePrivateBucket - Whether to store images in private bucket
 * @returns The created product with image URLs
 * @throws Error if the product cannot be created
 */
export async function createProduct(
  data: CreateProductDto["body"],
  files: Express.Multer.File[],
  usePrivateBucket: boolean = false
): Promise<Product> {
  if (files.length < 1) {
    throw new AppError(
      "At least one image is required",
      httpStatus.BAD_REQUEST
    );
  }
  // Convert multer files to File objects if images are provided
  let imageFiles: File[] = [];
  if (files && files.length > 0) {
    imageFiles = files.map((file) => {
      const blob = new Blob([file.buffer], { type: file.mimetype });
      return new File([blob], file.originalname, { type: file.mimetype });
    });
  }

  // First create the product without images
  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      unitPrice: data.unitPrice,
      unitType: data.unitType,
      packageSize: data.packageSize,
      stockQuantity: data.stockQuantity ?? 0,
      reorderLevel: data.reorderLevel ?? 0,
      isSubscription: data.isSubscription ?? false,
      isPreorder: data.isPreorder ?? false,
      preorderAvailabilityDate: data.preorderAvailabilityDate,
      imageUrls: [], // Start with empty array
      isPrivateImages: usePrivateBucket, // Store whether images are private
      categoryId: data.categoryId,
      farmerId: data.farmerId,
    },
  });

  // If images are provided, upload them and update the product
  if (imageFiles && imageFiles.length > 0) {
    try {
      const uploadResults = await uploadProductImages(
        imageFiles,
        product.productId,
        usePrivateBucket
      );
      const imageUrls = uploadResults.map((result) => result.url);

      // Update product with image URLs
      const updatedProduct = await prisma.product.update({
        where: { productId: product.productId },
        data: { imageUrls },
      });

      return updatedProduct;
    } catch (uploadError) {
      // If image upload fails, we still have the product created
      // Log the error but don't fail the entire operation
      console.error(
        "Failed to upload images during product creation:",
        uploadError
      );
      return product;
    }
  }

  return product;
}

/**
 * Retrieve all products with optional filtering, relations, and pagination
 * @param paginationParams - Pagination parameters (page, limit, skip)
 * @returns Paginated products with accessible image URLs and pagination metadata
 * @throws Error if the query fails
 */
export async function getAllProducts(
  paginationParams: GetAllProductsPaginationOptions,
  filterParams: GetAllProductsFilterOptions
): Promise<GetAllProductsResult> {
  const { limit, skip, page, sort } = paginationParams;

  // Build dynamic where clause
  const where: Prisma.ProductWhereInput = {
    ...(filterParams?.isSubscription !== undefined && {
      isSubscription: filterParams.isSubscription,
    }),
    ...(filterParams?.isPreorder !== undefined && {
      isPreorder: filterParams.isPreorder,
    }),
    ...(filterParams?.name && {
      name: {
        contains: filterParams.name,
        mode: "insensitive" as Prisma.QueryMode,
      },
    }),
    ...(filterParams?.categoryId && {
      categoryId: filterParams.categoryId,
    }),
  };

  // Get paginated products with optional relations
  const products = await prisma.product.findMany({
    where,
    include: {
      deal: true,
      category: {
        select: {
          categoryId: true,
          name: true,
        },
      },
      farmer: {
        select: {
          farmName: true,
        },
      },
    },
    take: limit,
    skip: skip,
    orderBy: {
      createdAt: sort === "asc" ? "asc" : "desc",
    },
  });

  // Process images if needed
  let processedProducts = await processProductsWithAccessibleUrls(products);

  // Apply pricing calculation
  processedProducts = await Promise.all(
    processedProducts.map(async (product) => {
      const {
        hasActiveDeal,
        hasActiveGlobalDeal,
        discountUnitPrice,
        discountType,
        discountValue,
      } = await calculateDealPricing(product);
      return {
        ...product,
        hasActiveDeal,
        hasActiveGlobalDeal,
        discountType,
        discountValue,
        discountUnitPrice,
      };
    })
  );

  // Count for pagination
  const totalCount = await prisma.product.count({ where });
  const totalPages = Math.ceil(totalCount / limit);

  return {
    products: processedProducts,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

/**
 * Retrieve a product by its ID with optional relations
 * @param productId - The ID of the product
 * @returns The product if found with accessible image URLs, or null if not found
 * @throws Error if the query fails
 */
export async function getProductById(
  productId: bigint
): Promise<ProductWithAccessibleImages & DealPricingResult> {
  const product = await prisma.product.findUnique({
    where: { productId },
    include: {
      category: true,
      farmer: true,
      deal: true,
    },
  });

  if (!product) {
    throw new AppError("Product not found", httpStatus.BAD_REQUEST);
  }

  // Calculate deal pricing
  const {
    hasActiveDeal,
    hasActiveGlobalDeal,
    discountUnitPrice,
    discountType,
    discountValue,
  } = await calculateDealPricing(product);

  // Generate accessible URLs if requested
  let accessibleImageUrls: string[] = [];
  if (product.imageUrls.length > 0) {
    accessibleImageUrls = await getBatchAccessibleImageUrls(
      product.imageUrls,
      product.isPrivateImages || false
    );
  }

  return {
    ...product,
    accessibleImageUrls,
    hasActiveDeal,
    hasActiveGlobalDeal,
    discountUnitPrice,
    discountType,
    discountValue,
  };
}

/**
 * Update a product by its ID with optional image uploads
 * @param productId - The ID of the product to update
 * @param data - Data to update the product
 * @param imageFiles - Optional array of new image files
 * @param replaceImages - Whether to replace existing images or add to them
 * @param usePrivateBucket - Whether new images should be stored in private bucket
 * @returns The updated product
 * @throws Error if the product is not found or update fails
 */
export async function updateProduct(
  productId: bigint,
  data: UpdateProductDto["body"],
  imageFiles?: File[],
  replaceImages = false,
  usePrivateBucket?: boolean
): Promise<Product> {
  // Get current product to access existing image URLs and privacy setting
  const currentProduct = await prisma.product.findUnique({
    where: { productId },
    select: {
      imageUrls: true,
      isPrivateImages: true,
      unitPrice: true,
      packageSize: true,
    },
  });

  if (!currentProduct) {
    throw new AppError("Product not found", httpStatus.BAD_REQUEST);
  }

  // Determine privacy setting for new images
  const shouldUsePrivate =
    usePrivateBucket ?? currentProduct.isPrivateImages ?? false;
  let finalImageUrls = currentProduct.imageUrls;

  // Handle image uploads if provided
  if (imageFiles && imageFiles.length > 0) {
    try {
      if (replaceImages) {
        // Replace existing images
        const uploadResults = await replaceProductImages(
          imageFiles,
          currentProduct.imageUrls,
          productId,
          shouldUsePrivate,
          currentProduct.isPrivateImages || false
        );
        finalImageUrls = uploadResults.map((result) => result.url);
      } else {
        // Add to existing images
        const uploadResults = await uploadProductImages(
          imageFiles,
          productId,
          shouldUsePrivate
        );
        finalImageUrls = [
          ...currentProduct.imageUrls,
          ...uploadResults.map((result) => result.url),
        ];
      }
    } catch (uploadError) {
      console.error(
        "Failed to upload images during product update:",
        uploadError
      );
      // Continue with update without new images
    }
  }

  // Update the product
  const product = await prisma.product.update({
    where: { productId: Number(productId) },
    data: {
      name: data.name,
      description: data.description,
      unitPrice: data.unitPrice,
      unitType: data.unitType,
      packageSize: data.packageSize,
      stockQuantity: data.stockQuantity,
      reorderLevel: data.reorderLevel,
      isSubscription: data.isSubscription,
      isPreorder: data.isPreorder,
      preorderAvailabilityDate: data.preorderAvailabilityDate,
      imageUrls: data.imageUrls ?? finalImageUrls, // Use provided URLs or processed ones
      isPrivateImages: usePrivateBucket ?? currentProduct.isPrivateImages,
      categoryId: data.categoryId,
      farmerId: data.farmerId,
    },
  });
  return product;
}

/**
 * Delete a product by its ID and clean up associated images
 * @param productId - The ID of the product to delete
 * @throws Error if the product is not found or deletion fails
 */
export async function deleteProduct(productId: bigint): Promise<void> {
  // First, get the product to access image URLs and privacy setting
  const product = await prisma.product.findUnique({
    where: { productId },
    select: {
      imageUrls: true,
      isPrivateImages: true,
    },
  });

  if (!product) {
    throw new AppError("Product not found", httpStatus.BAD_REQUEST);
  }

  // Delete the product from database first
  await prisma.product.delete({
    where: { productId },
  });

  // Clean up images from S3 if they exist (async, don't block the response)
  if (product.imageUrls && product.imageUrls.length > 0) {
    const s3Keys = product.imageUrls
      .map(extractS3KeyFromUrl)
      .filter((key): key is string => key !== null);

    if (s3Keys.length > 0) {
      // Run cleanup in background
      deleteMultipleFilesFromS3(s3Keys, product.isPrivateImages || false)
        .then(() => {
          logger.info("Successfully deleted S3 files:", s3Keys);
        })
        .catch((error) => {
          console.error(
            "Failed to cleanup S3 images after product deletion:",
            error
          );
        });
    }
  }
}
