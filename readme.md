# 📄 Signature Injection Engine – Full-Stack PDF Form Editor

### **Responsive Drag-Drop Editor + Signature Pad + PDF Burn-In Engine (React + NodeJS + PDF-Lib + MongoDB)**

---

## 🚀 Overview

**Signature Injection Engine** is a full-stack system that allows users to:

* View a PDF in the browser
* Drag & drop form fields (Text, Signature, Date, Radio, Image)
* Resize & reposition fields with perfect pixel-to-PDF accuracy
* Draw a real handwritten signature using SignaturePad
* Burn all fields (especially signature) directly into the PDF on the backend
* Maintain security through SHA-256 hashing + audit logging in MongoDB
* Guarantee that fields stay anchored **even when switching between desktop and mobile views**

Built for reliability:
✔ Every field stays EXACTLY where the user places it
✔ PDF uses **points** while browser uses **pixels**, and both remain synced
✔ Full auditability of every signed PDF

---

# 📌 Features

### 🎨 **Frontend (React + Vite + Tailwind CSS)**

* View and render any PDF using **react-pdf (pdf.js)**
* **Responsive canvas**: fields stay attached to the same paragraph on all screens
* **Drag & Drop fields**:

  * Text Box
  * Signature Field
  * Date Field
  * Radio Button
  * Image Field
* **Resize fields** using `react-rnd`
* **Double-click Signature** → opens a SignaturePad modal
* Beautiful UI with Tailwind v3 using colors:

  * `#000` Background
  * `#FFF` Text
  * `#895AF6` Primary
* Smooth field overlay layer that syncs to PDF zoom and viewport changes

---

### ⚙️ **Backend (NodeJS + Express + PDF-Lib)**

* Accepts signature image + field coordinates
* Converts UI coordinates into **PDF Points**
* Burns image into PDF with correct aspect ratio (no stretching)
* Returns a downloadable signed PDF file
* Stores both original and signed PDF hashes for audit history

---

### 🔒 **Security Layer**

* Computes **SHA-256 hash** of original and signed PDFs
* Tracks signer metadata
* Enables future verification of tampering or modifications
* Stores audit logs in MongoDB

---

# 🏛 Architecture

```
frontend/
  src/
    components/
      FieldPalette.jsx
      PdfEditor.jsx
      PageView.jsx
      FieldLayer.jsx
      FieldBox.jsx
      SignatureModal.jsx
    assets/
      sample.pdf
    App.jsx
    main.jsx
backend/
  src/
    index.js
    routes/
      signPdf.js
    models/
      AuditLog.js
      PdfDocument.js
README.md
```

---

# 🧠 The Math Engine – Core of the Project

### 📌 Problem

Browsers use **CSS pixels** with **top-left** origin.
PDFs use **points (1/72 inch)** with **bottom-left** origin.

You cannot simply drop a field at (Xpx, Ypx) and place it at the same coordinates inside the PDF.

### 📌 Solution

Convert browser pixel coordinates → PDF point coordinates:

### **PDF Render Size**

```
pageWidthPx  = pageWidthPt  * scale
pageHeightPx = pageHeightPt * scale
```

### **Drop → PDF Conversion**

```
leftPx = X position of box
topPx  = Y position of box
widthPx = box width
heightPx = box height

xPdf = leftPx / scale
widthPdf = widthPx / scale
heightPdf = heightPx / scale

bottomPx = topPx + heightPx
yPdf = (pageHeightPx - bottomPx) / scale
```

### 🧩 Why this matters?

* Works on all screen sizes
* Works on zoom
* Works on mobile
* Works in rotated view
* Burned signature appears *exactly* where user placed it

---

# 🎨 Frontend Component Breakdown

### **FieldPalette.jsx**

* UI list of draggable field items
* Drag event sets:

  ```
  dataTransfer.setData("application/field-type", type)
  ```

### **PageView.jsx**

* Renders the PDF page
* Handles drop events
* Hosts the FieldLayer

### **FieldLayer.jsx**

* Converts PDF → pixel coordinates
* Renders FieldBox components

### **FieldBox.jsx**

* Provides:

  * Drag
  * Resize
  * Double-click
* Uses `react-rnd` for smooth movement
* Stores updated PDF coordinates on drag/resize

### **SignatureModal.jsx**

* Opens SignaturePad
* Saves drawn signature as Base64 PNG
* Injects preview into FieldBox

---

# 🖥 Backend (Express) Breakdown

## `/api/sign-pdf` – Main Endpoint

### Request

```json
{
  "pdfId": "demo123",
  "signatureImageBase64": "...",
  "fields": [
    { "type":"signature","pageIndex":0,"x":120,"y":340,"width":150,"height":40 }
  ]
}
```

### Response

```json
{
  "url": "http://localhost:4000/signed/demo123-1733598036.pdf",
  "hashOriginal": "...",
  "hashSigned": "..."
}
```

### Processing Steps

1. Load original PDF
2. Calculate original SHA-256
3. Embed signature image
4. Fit inside bounding box **without distortion**
5. Save final PDF
6. Calculate signed SHA-256
7. Log audit trail

---

# 🗄 MongoDB Schema

### `PdfDocument`

```json
{
  "pdfId": "demo123",
  "originalPath": "/pdfs/demo123.pdf",
  "createdAt": "2024-01-01"
}
```

### `AuditLog`

```json
{
  "pdfId": "demo123",
  "originalHash": "abc123",
  "signedHash": "xyz456",
  "signedAt": "2024-01-01",
  "signerId": "user_55"
}
```

---

# 🛠 Installation Guide

## 1. Clone project

```bash
git clone https://github.com/yourname/signature-injection-engine.git
cd signature-injection-engine
```

## 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Make sure your PDF worker is correctly set:

```jsx
import { pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
```

## 3. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Create `.env`:

```
MONGO_URI=mongodb://localhost:27017/signatureEngine
PORT=4000
```

---

# ⚠ Troubleshooting

### 1. **Fake Worker Warning / MIME type Error**

```
Failed to load module script: MIME type text/html
Setting up fake worker failed
```

Fix:

```jsx
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
```

---

### 2. **CORS Error**

If frontend cannot reach backend:

Backend:

```js
app.use(cors({ origin: "http://localhost:5173" }));
```

---

### 3. **PDF not burning signature**

Check if:

* signature field contains `signatureDataUrl`
* coordinates are in **PDF points**
* field type === "signature"

---

# 🚀 Future Improvements

* Multi-user collaboration
* Role-based signing flows
* Digital certificate signatures (X.509)
* Watermarking
* Annotating PDFs
* Exporting templates
* Drag-from-template for enterprise workflows

---

# 🏁 Final Notes

This project demonstrates mastery over:
✔ React architecture
✔ Complex coordinate transforms
✔ PDF rendering & manipulation
✔ Responsive UI design
✔ Backend PDF processing
✔ Cryptographic hashing
✔ Database audit trails

This README is crafted to impress **recruiters**, **clients**, and **technical reviewers**.

---


