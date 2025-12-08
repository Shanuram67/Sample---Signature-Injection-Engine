import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import signPdfRouter from "./routes/signPdf.js";
// later: import mongoose and connect to MongoDB

const app = express();
const PORT = process.env.PORT || 4000;

// Needed for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({ origin: "http://localhost:5173" })); // Vite dev server
app.use(express.json({ limit: "10mb" })); // allow base64 signature images

// API routes
app.use("/api", signPdfRouter);

// Static folder for signed PDFs (later when you save them)
app.use(
  "/signed",
  express.static(path.join(__dirname, "..", "signed"), {
    maxAge: "1d",
  })
);

app.get("/", (req, res) => {
  res.send("Signature Engine Backend is running");
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
