// src/components/PdfEditor.jsx
import React, { useState, useRef, useCallback, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import FieldPalette from "./FieldPalette";
import PageView from "./PageView";
import SignatureModal from "./SignatureModal";
import samplePdf from "../assets/sample.pdf";

// pdf.js worker for Vite/Esm
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PdfEditor = () => {
  const [numPages, setNumPages] = useState(null);
  const [pageMeta, setPageMeta] = useState({ widthPt: null, heightPt: null });
  const [scale, setScale] = useState(1.2);
  const [fields, setFields] = useState([]);
  // PdfEditor.jsx (inside component, near other useState hooks)
const [dragPreview, setDragPreview] = useState(null); 
// shape: { type, pageIndex, leftPx, topPx, widthPx, heightPx }

// Timeout id to clear preview after leaving quickly
  const dragLeaveTimeoutRef = useRef(null);
  const [uploadedPdfs, setUploadedPdfs] = useState([
    { pdfId: "sample", originalPath: samplePdf },
  ]);
  const [selectedPdfId, setSelectedPdfId] = useState("sample");

  const [activeSignatureFieldId, setActiveSignatureFieldId] = useState(null);

  const containerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  const onPageLoadSuccess = useCallback(
    (page) => {
      if (!pageMeta.widthPt || !pageMeta.heightPt) {
        const widthPt = page.originalWidth;
        const heightPt = page.originalHeight;
        setPageMeta({ widthPt, heightPt });

        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const padding = 40;
          const newScale = (containerWidth - padding) / widthPt;
          setScale(Math.min(newScale, 1.5));
        }
      }
    },
    [pageMeta.widthPt, pageMeta.heightPt]
  );

  // upload PDF (multipart)

  const uploadPdf = useCallback(async (file) => {
  const form = new FormData();
  form.append("pdf", file);
  const res = await fetch("https://sample-signature-injection-engine.onrender.com/api/upload-pdf", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Upload failed");
  }
  const json = await res.json(); // { pdfId, originalPath, publicUrl, publicPath }
  // Use publicUrl (relative path from server)
  setUploadedPdfs((prev) => [
    { pdfId: json.pdfId, originalPath: json.originalPath, publicUrl: json.publicUrl },
    ...prev,
  ]);
  setSelectedPdfId(json.pdfId);
    }, []);


  const currentFileSource = useMemo(() => {
  const pdf = uploadedPdfs.find((p) => p.pdfId === selectedPdfId);
  if (!pdf) return samplePdf;
  // If server returned a publicUrl, use absolute origin + publicUrl.
  // If the publicUrl is already absolute, use it directly.
  if (pdf.publicUrl) {
    // If you prefer relative path, you can use pdf.publicUrl directly (browser will call same origin)
    return pdf.publicUrl.startsWith("http") ? pdf.publicUrl : `https://sample-signature-injection-engine.onrender.com${pdf.publicUrl}`;
  }
  // fallback to originalPath (if you embedded a local asset)
  return pdf.originalPath || samplePdf;
}, [selectedPdfId, uploadedPdfs]);



    // Called from PageView on dragOver to update preview position
const handleDragOverPreview = useCallback((pageIndex, clientX, clientY, pageRect, fieldType) => {
  if (!pageMeta.widthPt || !pageMeta.heightPt) return;

  // compute where preview should appear (px coords relative to page)
  const dropX = clientX - pageRect.left;
  const dropY = clientY - pageRect.top;

  const widthPx = fieldType === "signature" ? 180 : 150;
  const heightPx = fieldType === "signature" ? 80 : 40;

  const leftPx = Math.max(0, Math.min(pageRect.width - widthPx, dropX - widthPx / 2));
  const topPx = Math.max(0, Math.min(pageRect.height - heightPx, dropY - heightPx / 2));

  setDragPreview({
    type: fieldType,
    pageIndex,
    leftPx,
    topPx,
    widthPx,
    heightPx,
  });

  // clear any scheduled removal
  if (dragLeaveTimeoutRef.current) {
    clearTimeout(dragLeaveTimeoutRef.current);
    dragLeaveTimeoutRef.current = null;
  }
}, [pageMeta, scale]);

// Called from PageView when drag leaves page
const handleDragLeavePreview = useCallback(() => {
  // don't remove immediately — small buffer to allow re-entry
  if (dragLeaveTimeoutRef.current) clearTimeout(dragLeaveTimeoutRef.current);
  dragLeaveTimeoutRef.current = setTimeout(() => {
    setDragPreview(null);
    dragLeaveTimeoutRef.current = null;
  }, 120); // small delay
}, []);

// When user actually drops, create field and clear preview
const handleDropField = useCallback((pageIndex, clientX, clientY, pageRect, fieldType) => {
  if (!pageMeta.widthPt || !pageMeta.heightPt) return;

  // (existing conversion from earlier) --- compute PDF coords
  const viewportHeightPx = pageMeta.heightPt * scale;
  const dropX = clientX - pageRect.left;
  const dropY = clientY - pageRect.top;

  const widthPx = fieldType === "signature" ? 180 : 150;
  const heightPx = fieldType === "signature" ? 80 : 40;

  const leftPx = dropX - widthPx / 2;
  const topPx = dropY - heightPx / 2;

  const xPdf = leftPx / scale;
  const widthPdf = widthPx / scale;
  const heightPdf = heightPx / scale;
  const bottomPx = topPx + heightPx;
  const yPdf = (viewportHeightPx - bottomPx) / scale;

  const newField = {
    id: `field_${Date.now()}`,
    type: fieldType,
    pageIndex,
    x: xPdf,
    y: yPdf,
    width: widthPdf,
    height: heightPdf,
    pdfId: selectedPdfId,
  };

  setFields(prev => [...prev, newField]);
  setDragPreview(null); // clear preview
  }, [pageMeta, scale, selectedPdfId]);
  const updateField = useCallback((id, partial) => {
  setFields(prev => {
    if (partial && partial._delete) {
      return prev.filter(f => f.id !== id);
    }
    return prev.map(f => (f.id === id ? { ...f, ...partial } : f));
  });
}, []);


  const handleStartSign = useCallback((fieldId) => {
    setActiveSignatureFieldId(fieldId);
  }, []);

  const handleSaveSignature = useCallback(
    (dataUrl) => {
      if (!activeSignatureFieldId) return;
      updateField(activeSignatureFieldId, { signatureDataUrl: dataUrl });
      setActiveSignatureFieldId(null);
    },
    [activeSignatureFieldId, updateField]
  );

  const handleCancelSignature = useCallback(() => {
    setActiveSignatureFieldId(null);
  }, []);

  const activeSignatureField = fields.find((f) => f.id === activeSignatureFieldId);

  const currentPdfFields = useMemo(() => {
    return fields.filter((f) => f.pdfId === selectedPdfId);
  }, [fields, selectedPdfId]);

  return (
    <>
      {/* Left: Palette */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-primary/40 p-4 space-y-4">
        <FieldPalette />
      </aside>

      {/* Right: PDF area */}
      <section className="flex-1 overflow-auto p-4" ref={containerRef}>
        <div className="flex flex-col items-center gap-6">
          {/* PDF selector / upload */}
          <div className="mb-3 flex items-center gap-3">
            <label className="text-sm">PDF</label>
            <select
              value={selectedPdfId || ""}
              onChange={(e) => setSelectedPdfId(e.target.value)}
              className="bg-surface px-2 py-1 rounded text-sm"
            >
              <option value="" disabled>
                Select a PDF
              </option>
              {uploadedPdfs.map((p) => (
                <option key={p.pdfId} value={p.pdfId}>
                  {p.pdfId}
                </option>
              ))}
            </select>

            <input
              type="file"
              accept="application/pdf"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  try {
                    await uploadPdf(f);
                  } catch (err) {
                    console.error(err);
                    alert("Upload failed: " + err.message);
                  }
                }
              }}
            />
          </div>

          {/* PDF Viewer */}
          <Document
            file={currentFileSource}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="text-sm text-gray-300">Loading PDF…</div>}
          >
            {Array.from(new Array(numPages || 0), (_, index) => (
              // inside PdfEditor.jsx where you render PageView:
<PageView
  key={`page_${index + 1}_${selectedPdfId}`}
  pageNumber={index + 1}
  pageIndex={index}
  scale={scale}
  pageMeta={pageMeta}
  onPageLoadSuccess={onPageLoadSuccess}
  fields={currentPdfFields.filter((f) => f.pageIndex === index)}
  onDropField={handleDropField}
  onUpdateField={updateField}
  onStartSign={handleStartSign}
  onDragOverPreview={handleDragOverPreview}     // pass handler
  onDragLeavePreview={handleDragLeavePreview}   // pass handler
  dragPreview={dragPreview}                     // pass dragPreview state
/>

            ))}
          </Document>

          {/* Sign button */}
          <button
            onClick={async () => {
              if (!selectedPdfId) return alert("Please select or upload a PDF before signing.");
              try {
                const fieldsToSend = currentPdfFields.map((f) => ({
                  id: f.id,
                  type: f.type,
                  pageIndex: f.pageIndex,
                  x: f.x,
                  y: f.y,
                  width: f.width,
                  height: f.height,
                  value: f.value || null,
                  imageBase64: f.signatureDataUrl || f.imageDataUrl || null,
                }));

                const payload = {
                  pdfId: selectedPdfId,
                  signerId: "user_123",
                  fields: fieldsToSend,
                };

                const resp = await fetch("https://sample-signature-injection-engine.onrender.com/api/sign-pdf", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });

                if (!resp.ok) {
                  const err = await resp.json();
                  throw new Error(err.message || "Sign failed");
                }

                const data = await resp.json();
                window.open(`https://sample-signature-injection-engine.onrender.com${data.url}`, "_blank");
              } catch (err) {
                console.error(err);
                alert("Sign failed: " + err.message);
              }
            }}
            className="px-3 py-2 rounded bg-primary text-black font-semibold hover:bg-primary/80"
          >
            Sign & Download
          </button>
        </div>
      </section>

      {/* Signature modal */}
      {activeSignatureField && (
        <SignatureModal field={activeSignatureField} onSave={handleSaveSignature} onCancel={handleCancelSignature} />
      )}
    </>
  );
};

export default PdfEditor;
