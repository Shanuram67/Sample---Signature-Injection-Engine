// backend/src/routes/uploadPdf.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import PdfDocumentModel from "../models/PdfDocument.js";

const router = Router();
const uploadFolder = path.join(process.cwd(), "uploads");

// Ensure folder exists
await fs.mkdir(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") return cb(new Error("Only PDFs allowed"), false);
    cb(null, true);
  },
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

router.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF file required" });

    // Save metadata into DB with a relative public path
    const pdfId = `pdf_${Date.now()}`;
    // Save the stored filename, not the absolute file:// path
    const publicPath = `/uploads/${req.file.filename}`;

    const originalPath = req.file.path; // absolute filesystem path (optional to keep)
    await PdfDocumentModel.create({ pdfId, originalPath, publicPath });

    // Return the publicUrl for frontend consumption
    return res.json({
      pdfId,
      originalPath,
      publicPath,
      publicUrl: publicPath, // frontend can prepend backend origin if needed
    });
  } catch (err) {
    console.error("upload-pdf error", err);
    return res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

export default router;
