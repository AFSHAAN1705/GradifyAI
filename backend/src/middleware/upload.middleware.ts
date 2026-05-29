import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

const uploadDir = path.resolve(env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-z0-9._-]/gi, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const ALLOWED_TYPES = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  txt: ["text/plain"],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/quicktime", "video/x-msvideo"],
};

export const uploadSamFile = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allTypes = Object.values(ALLOWED_TYPES).flat();
    if (allTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError("Unsupported file type. Allowed: PDF, DOCX, TXT, JPG, PNG, WEBP, GIF, MP4, MOV, AVI", 415, "UNSUPPORTED_FILE"));
    }
  }
});
export const uploadPdf = uploadSamFile;
export { ALLOWED_TYPES };
