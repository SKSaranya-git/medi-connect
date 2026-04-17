import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

// Parse cloudinary://api_key:api_secret@cloud_name
const cloudinaryUrl = process.env.CLOUDINARY_URL || "";
const cloudinaryMatch = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);

cloudinary.config({
  api_key: cloudinaryMatch?.[1] || "",
  api_secret: cloudinaryMatch?.[2] || "",
  cloud_name: cloudinaryMatch?.[3] || "",
  signature_algorithm: "sha256",
});

// Use memory storage — file buffer is uploaded to Cloudinary manually
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and PDF files are allowed."), false);
    }
  },
});

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadToCloudinary = (buffer, folder = "mediconnect/doctor-ids") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

export { cloudinary, upload, uploadToCloudinary };
