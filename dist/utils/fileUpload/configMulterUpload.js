"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.multerFileToFileObject = multerFileToFileObject;
// utils/configMulterUpload.ts
const multer_1 = __importDefault(require("multer"));
// Configure multer for file uploads
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024, // Default 5MB
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only image files are allowed"));
        }
    },
});
function multerFileToFileObject(multerFile) {
    // Create a Blob from the buffer
    const blob = new Blob([multerFile.buffer], { type: multerFile.mimetype });
    // Create a File from the Blob
    return new File([blob], multerFile.originalname, {
        type: multerFile.mimetype,
        lastModified: Date.now(),
    });
}
