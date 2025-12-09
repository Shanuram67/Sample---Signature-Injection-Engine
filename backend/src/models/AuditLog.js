import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  pdfId: { type: String, required: true },
  originalHash: { type: String, required: true },
  signedHash: { type: String, required: true },
  signedAt: { type: Date, default: Date.now },
  signerId: { type: String },
  signedPath: { type: String }, // where signed file is stored
});

export default mongoose.model("AuditLog", AuditLogSchema);
