import mongoose from "mongoose";

const PdfDocumentSchema = new mongoose.Schema({
  pdfId: { type: String, required: true, unique: true },
  originalPath: { type: String, required: true }, // local path or S3 key
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("PdfDocument", PdfDocumentSchema);
