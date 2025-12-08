import { Router } from "express";

const router = Router();

// This is where we will later use pdf-lib to burn signatures
router.post("/sign-pdf", async (req, res) => {
  try {
    const { pdfId, signatureImageBase64, fields } = req.body;

    // TODO:
    // 1. Load original PDF from disk or S3 using pdfId
    // 2. Use pdf-lib to draw signature image onto correct position
    // 3. Save signed PDF to /signed folder
    // 4. Compute SHA-256 hashes and save to MongoDB
    // 5. Return public URL

    console.log("Received sign request", { pdfId, fieldsCount: fields?.length });

    return res.json({
      message: "sign-pdf stub - implement me with pdf-lib",
      url: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error in sign-pdf" });
  }
});

export default router;
