import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import PdfDocumentModel from "../models/PdfDocument.js";
import AuditLogModel from "../models/AuditLog.js";

const router = Router();

// utility: sha256 hex
function sha256Hex(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// Helper: strip data URL prefix
function base64ToUint8Array(dataUrl) {
  if (!dataUrl) return null;
  const base64 = dataUrl.split(",")[1] ?? dataUrl;
  const binary = Buffer.from(base64, "base64");
  return binary;
}

// Ensure signed folder exists
const signedFolder = path.join(process.cwd(), "signed");
await fs.mkdir(signedFolder, { recursive: true });

router.post("/sign-pdf", async (req, res) => {
  try {
    const { pdfId, fields = [], signerId } = req.body;
    if (!pdfId) return res.status(400).json({ message: "pdfId required" });

    // 1) find pdf metadata
    const pdfMeta = await PdfDocumentModel.findOne({ pdfId });
    if (!pdfMeta) return res.status(404).json({ message: "PDF not found" });

    const originalPath = pdfMeta.originalPath;
    const originalAbsPath = path.isAbsolute(originalPath)
      ? originalPath
      : path.join(process.cwd(), originalPath);

    // 2) read original PDF bytes
    const originalBytes = await fs.readFile(originalAbsPath);
    const originalHash = sha256Hex(originalBytes);

    // 3) load with pdf-lib
    const pdfDoc = await PDFDocument.load(originalBytes);

    // If you need fonts or text: embed a standard font
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 4) process fields
    for (const f of fields) {
      const { type, pageIndex, x, y, width, height, imageBase64, value } = f;
      const page = pdfDoc.getPage(pageIndex);
      if (!page) continue;

      if (type === "signature" || type === "image") {
        if (!imageBase64) continue;
        // convert image
        const imgBytes = base64ToUint8Array(imageBase64);

        // pdf-lib supports embedPng / embedJpg
        let embeddedImg;
        const isPng = imageBase64.trim().startsWith("data:image/png") || (imgBytes[0] === 0x89);
        if (isPng) embeddedImg = await pdfDoc.embedPng(imgBytes);
        else embeddedImg = await pdfDoc.embedJpg(imgBytes);

        const imgWidth = embeddedImg.width;
        const imgHeight = embeddedImg.height;

        // Fit contained within box preserving aspect ratio
        const boxW = width;
        const boxH = height;
        const boxAspect = boxW / boxH;
        const imgAspect = imgWidth / imgHeight;

        let drawW, drawH;
        if (imgAspect > boxAspect) {
          // image is wider -> fit width
          drawW = boxW;
          drawH = boxW / imgAspect;
        } else {
          // taller -> fit height
          drawH = boxH;
          drawW = boxH * imgAspect;
        }

        const drawX = x + (boxW - drawW) / 2;
        const drawY = y + (boxH - drawH) / 2;

        page.drawImage(embeddedImg, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
        });
      } else if (type === "text") {
        // text: draw centered left-top inside box
        const text = (value ?? "").toString();
        const fontSize = 10;
        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
        const tx = x + 4; // small padding
        const ty = y + height - fontSize - 4; // from bottom, we want near top of box
        page.drawText(text, { x: tx, y: ty, size: fontSize, font: helveticaFont, color: rgb(0, 0, 0) });
      } else if (type === "date") {
        const text = (value ?? "").toString();
        const fontSize = 10;
        const tx = x + 4;
        const ty = y + height - fontSize - 4;
        page.drawText(text, { x: tx, y: ty, size: fontSize, font: helveticaFont, color: rgb(0, 0, 0) });
      } else if (type === "radio") {
        // draw a simple filled circle if checked (value true)
        if (f.value) {
          const cx = x + width / 2;
          const cy = y + height / 2;
          const r = Math.min(width, height) * 0.25;
          page.drawCircle({ x: cx, y: cy, size: r, color: rgb(0, 0, 0) }); // pdf-lib doesn't have drawCircle; use drawEllipse
          // fallback using drawEllipse:
          page.drawEllipse({ x: cx, y: cy, xScale: r, yScale: r, color: rgb(0, 0, 0) });
        } else {
          // draw an empty circle
          const cx = x + width / 2;
          const cy = y + height / 2;
          const r = Math.min(width, height) * 0.25;
          page.drawEllipse({ x: cx, y: cy, xScale: r, yScale: r, borderColor: rgb(0, 0, 0), borderWidth: 1 });
        }
      }
    } // end fields loop

    // 5) save signed PDF
    const signedBytes = await pdfDoc.save();
    const signedHash = sha256Hex(signedBytes);

    // write to disk
    const signedFileName = `${pdfId}-signed-${Date.now()}.pdf`;
    const signedPath = path.join(signedFolder, signedFileName);
    await fs.writeFile(signedPath, signedBytes);

    // 6) save audit log
    await AuditLogModel.create({
      pdfId,
      originalHash,
      signedHash,
      signedAt: new Date(),
      signerId: signerId || null,
      signedPath: signedPath,
    });

    // 7) return URL to client
    // static route in index.js serves /signed folder
    const publicUrl = `/signed/${signedFileName}`;

    return res.json({ url: publicUrl, originalHash, signedHash });
  } catch (err) {
    console.error("sign-pdf error:", err);
    return res.status(500).json({ message: "Error in sign-pdf", error: err?.message });
  }
});

export default router;
