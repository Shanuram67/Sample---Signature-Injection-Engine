import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import signPdfRouter from "./routes/signPdf.js";
import uploadPdfRouter from "./routes/uploadPdf.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// --- MongoDB URI Construction ---
const user = process.env.MONGO_USER ? encodeURIComponent(process.env.MONGO_USER) : null;
const pass = process.env.MONGO_PASS ? encodeURIComponent(process.env.MONGO_PASS) : null;
const host = process.env.MONGO_HOST; // e.g. cluster0.abcd.mongodb.net
const dbName = process.env.MONGO_DB || "signatureEngine";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let uri = process.env.MONGO_URI;

if (!uri) {
  if (user && pass && host) {
    uri = `mongodb+srv://${user}:${pass}@${host}/${dbName}?retryWrites=true&w=majority`;
  } else {
    uri = `mongodb://127.0.0.1:27017/${dbName}`;
  }
}
// ✅ ADDED/CORRECTED CONSOLE LOG: Safely logs the connection URI
console.log("Connecting to MongoDB URI:", uri.replace(/:\/\/.*@/, "://<redacted>@"));

async function start() {
  try {
    // Connect to MongoDB
    await mongoose.connect(uri, { 
      serverSelectionTimeoutMS: 5000,
      // The options below are no longer needed in Mongoose 6+ but are safe to leave
      // useNewUrlParser: true, 
      // useUnifiedTopology: true, 
    });
    console.log("🟢 MongoDB connected successfully!");

    // Start the Express server after successful DB connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}`);
    });

  } catch (err) {
    // ✅ ADDED/CORRECTED CONSOLE LOG: Display a specific MongoDB startup error message
    console.error("🔴 MongoDB startup error: Failed to connect to the database.");
    console.error(err); // Log the full error object for detailed diagnostics
    process.exit(1);
  }
}

// --- Express Middleware and Routes ---
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "20mb" }));

app.use("/api", signPdfRouter);
app.use("/api", uploadPdfRouter);
// after existing static for /signed...
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));


// serve signed files
app.use("/signed", express.static(path.join(process.cwd(), "signed")));

app.get("/", (req, res) => res.send("Signature Engine Backend"));

// --- Start the application ---
start();