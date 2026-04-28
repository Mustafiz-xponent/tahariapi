"use strict";
/**
 * AWS S3 utility functions for file upload, delete operations, and private bucket access
 * Updated to support both public and private bucket operations with presigned URLs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToS3 = uploadFileToS3;
exports.getPresignedUrl = getPresignedUrl;
exports.getMultiplePresignedUrls = getMultiplePresignedUrls;
exports.deleteFileFromS3 = deleteFileFromS3;
exports.deleteMultipleFilesFromS3 = deleteMultipleFilesFromS3;
exports.extractS3KeyFromUrl = extractS3KeyFromUrl;
exports.uploadProductImages = uploadProductImages;
exports.replaceProductImages = replaceProductImages;
exports.getAccessibleImageUrl = getAccessibleImageUrl;
exports.getBatchAccessibleImageUrls = getBatchAccessibleImageUrls;
exports.processProductsWithAccessibleUrls = processProductsWithAccessibleUrls;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const logger_1 = __importDefault(require("../../utils/logger"));
// Configure AWS S3 client
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
/**
 * Upload any file to S3 (Public or Private Bucket)
 * @param file - File to upload
 * @param folderPath - Folder path in S3 bucket (e.g., 'products', 'users/avatars')
 * @param fileName - Custom filename (optional, will use original name if not provided)
 * @param isPrivate - Whether to upload to private bucket (default: false)
 * @returns Object containing file URL/key and S3 key
 */
async function uploadFileToS3(file, folderPath, fileName, isPrivate = false) {
    const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024;
    // Handle file size validation
    const fileSize = file instanceof File ? file.size : file.length;
    if (fileSize > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File size exceeds ${process.env.MAX_FILE_SIZE_MB || 10} MB`);
    }
    // Prepare file buffer
    let fileBuffer;
    let contentType;
    let originalName;
    if (file instanceof File) {
        fileBuffer = Buffer.from(await file.arrayBuffer());
        contentType = file.type;
        originalName = file.name;
    }
    else {
        fileBuffer = file;
        contentType = "application/octet-stream";
        originalName = fileName || "uploaded-file";
    }
    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFilename = fileName || `${timestamp}-${originalName}`;
    const s3Key = `${folderPath}/${uniqueFilename}`;
    // Choose bucket based on privacy setting
    const bucketName = isPrivate
        ? process.env.AWS_PRIVATE_BUCKET_NAME
        : process.env.AWS_BUCKET_NAME;
    const uploadParams = {
        Bucket: bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: contentType,
        // Set ACL for public buckets only
        ...(isPrivate ? {} : { ACL: "public-read" }),
    };
    try {
        const result = await s3Client.send(new client_s3_1.PutObjectCommand(uploadParams));
        logger_1.default.info(`File uploaded to S3: ${result}`);
        // Generate appropriate URL based on bucket type
        let fileUrl;
        if (isPrivate) {
            // For private buckets, return the S3 key (presigned URL will be generated on demand)
            fileUrl = s3Key;
        }
        else {
            // For public buckets, return direct URL
            fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        }
        return {
            success: true,
            key: s3Key,
            url: fileUrl,
            fileName: uniqueFilename,
            isPrivate,
        };
    }
    catch (error) {
        console.error("Error uploading file to S3:", error);
        throw new Error("Failed to upload file");
    }
}
/**
 * Generate presigned URL for private bucket file access
 * @param s3Key - S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 300 = 5 minutes)
 * @param bucketName - Optional bucket name (uses private bucket by default)
 * @returns Presigned URL string
 */
async function getPresignedUrl(s3Key, expiresIn = 300, bucketName) {
    if (!s3Key) {
        throw new Error("S3 key is required to generate presigned URL");
    }
    const bucket = bucketName || process.env.AWS_PRIVATE_BUCKET_NAME;
    const command = new client_s3_1.GetObjectCommand({
        Bucket: bucket,
        Key: s3Key,
    });
    try {
        const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, {
            expiresIn,
        });
        return presignedUrl;
    }
    catch (error) {
        console.error("Error generating presigned URL:", error);
        throw new Error("Failed to generate presigned URL");
    }
}
/**
 * Generate multiple presigned URLs for batch access
 * @param s3Keys - Array of S3 object keys
 * @param expiresIn - URL expiration time in seconds (default: 300 = 5 minutes)
 * @param bucketName - Optional bucket name (uses private bucket by default)
 * @returns Array of objects with key and presigned URL
 */
async function getMultiplePresignedUrls(s3Keys, expiresIn = 300, bucketName) {
    const results = await Promise.allSettled(s3Keys.map(async (key) => ({
        key,
        url: await getPresignedUrl(key, expiresIn, bucketName),
        success: true,
    })));
    return results.map((result, index) => ({
        key: s3Keys[index],
        url: result.status === "fulfilled" ? result.value.url : "",
        success: result.status === "fulfilled",
    }));
}
/**
 * Delete file from S3 bucket (works for both public and private)
 * @param s3Key - S3 object key to delete
 * @param isPrivate - Whether file is in private bucket
 * @returns Boolean indicating success
 */
async function deleteFileFromS3(s3Key, isPrivate = false) {
    if (!s3Key) {
        console.warn("No S3 key provided for deletion");
        return false;
    }
    const bucketName = isPrivate
        ? process.env.AWS_PRIVATE_BUCKET_NAME
        : process.env.AWS_BUCKET_NAME;
    try {
        await s3Client.send(new client_s3_1.DeleteObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
        }));
        logger_1.default.info(`File deleted from S3: ${s3Key}`);
        return true;
    }
    catch (error) {
        console.error("Error deleting file from S3:", error);
        return false;
    }
}
/**
 * Delete multiple files from S3 bucket
 * @param s3Keys - Array of S3 object keys to delete
 * @param isPrivate - Whether files are in private bucket
 * @returns Array of deletion results
 */
async function deleteMultipleFilesFromS3(s3Keys, isPrivate = false) {
    const results = await Promise.allSettled(s3Keys.map(async (key) => ({
        key,
        success: await deleteFileFromS3(key, isPrivate),
    })));
    return results.map((result, index) => ({
        key: s3Keys[index],
        success: result.status === "fulfilled" ? result.value.success : false,
    }));
}
/**
 * Extract S3 key from full S3 URL
 * @param s3Url - Full S3 URL or S3 key
 * @returns S3 key or null if invalid URL
 */
function extractS3KeyFromUrl(s3Url) {
    if (!s3Url)
        return null;
    try {
        // If it's already just a key (no domain), return as is
        if (!s3Url.includes("amazonaws.com") && !s3Url.startsWith("http")) {
            return s3Url;
        }
        // Handle both formats:
        // https://bucket-name.s3.region.amazonaws.com/key
        // https://s3.region.amazonaws.com/bucket-name/key
        const amazonawsMatch = s3Url.match(/\.amazonaws\.com\/(.+)$/);
        if (amazonawsMatch) {
            return amazonawsMatch[1];
        }
        return null;
    }
    catch (error) {
        console.error("Error extracting S3 key from URL:", error);
        return null;
    }
}
/**
 * Upload product images to S3 (supports both public and private)
 * @param files - Array of files to upload
 * @param productId - Product ID for folder organization
 * @param isPrivate - Whether to upload to private bucket
 * @returns Array of uploaded file information
 */
async function uploadProductImages(files, productId, isPrivate = false) {
    const folderPath = `products/${productId}`;
    const uploadPromises = files.map(async (file) => {
        const result = await uploadFileToS3(file, folderPath, undefined, isPrivate);
        return {
            url: result.url,
            key: result.key,
            isPrivate: result.isPrivate,
        };
    });
    return Promise.all(uploadPromises);
}
/**
 * Replace product images - delete old ones and upload new ones
 * @param newFiles - New files to upload
 * @param oldImageUrls - Old image URLs to delete
 * @param productId - Product ID for folder organization
 * @param isPrivate - Whether to upload to private bucket
 * @param oldFilesArePrivate - Whether old files are in private bucket
 * @returns Array of new uploaded file information
 */
async function replaceProductImages(productId, isPrivate = false, oldFilesArePrivate = false, oldImageUrls, newFiles) {
    // Delete old images first if exists
    if (oldImageUrls && oldImageUrls.length > 0) {
        const oldKeys = oldImageUrls
            .map(extractS3KeyFromUrl)
            .filter((key) => key !== null);
        if (oldKeys.length > 0) {
            await deleteMultipleFilesFromS3(oldKeys, oldFilesArePrivate);
        }
    }
    // Upload new images
    return newFiles?.length
        ? await uploadProductImages(newFiles, productId, isPrivate)
        : [];
}
/**
 * Get accessible URL for image (presigned for private, direct for public)
 * @param imageUrl - Image URL or S3 key
 * @param isPrivate - Whether image is in private bucket
 * @param expiresIn - Expiration time for presigned URL (only used for private)
 * @returns Accessible URL
 */
async function getAccessibleImageUrl(imageUrl, isPrivate, expiresIn = 300) {
    if (!isPrivate) {
        // For public images, return the URL as is
        return imageUrl;
    }
    // For private images, generate presigned URL
    const s3Key = extractS3KeyFromUrl(imageUrl) || imageUrl;
    return await getPresignedUrl(s3Key, expiresIn);
}
/**
 * Batch get accessible URLs for multiple images
 * @param imageUrls - Array of image URLs or S3 keys
 * @param isPrivate - Whether images are in private bucket
 * @param expiresIn - Expiration time for presigned URLs (only used for private)
 * @returns Array of accessible URLs
 */
async function getBatchAccessibleImageUrls(imageUrls, isPrivate, expiresIn = 300) {
    if (!isPrivate) {
        // For public images, return URLs as is
        return imageUrls;
    }
    // For private images, generate presigned URLs
    const s3Keys = imageUrls.map((url) => extractS3KeyFromUrl(url) || url);
    const results = await getMultiplePresignedUrls(s3Keys, expiresIn);
    return results.map((result) => (result.success ? result.url : ""));
}
/**
 * Helper function to process products with accessible URLs
 * @param products - Array of products
 * @param urlExpiresIn - Expiration time for presigned URLs in seconds
 * @returns Products with accessible image URLs
 */
async function processProductsWithAccessibleUrls(products, urlExpiresIn = 300) {
    return Promise.all(products.map(async (product) => {
        if (product.imageUrls.length === 0) {
            return { ...product, accessibleImageUrls: [] };
        }
        const accessibleUrls = await getBatchAccessibleImageUrls(product.imageUrls, product.isPrivateImages || false, urlExpiresIn);
        return {
            ...product,
            accessibleImageUrls: accessibleUrls,
        };
    }));
}
