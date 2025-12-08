import React, { useState, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import FieldPalette from "./FieldPalette";
import PageView from "./PageView";
import SignatureModal from "./SignatureModal";
import samplePdf from "../assets/sample.pdf";

// worker config here
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PdfEditor = () => {
  const [numPages, setNumPages] = useState(null);
  const [pageMeta, setPageMeta] = useState({ widthPt: null, heightPt: null });
  const [scale, setScale] = useState(1.2);
  const [fields, setFields] = useState([]);

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

  // === DROP: browser pixels -> PDF points ===
  const handleDropField = (pageIndex, clientX, clientY, pageRect, fieldType) => {
    if (!pageMeta.widthPt || !pageMeta.heightPt) return;

    const viewportHeightPx = pageMeta.heightPt * scale;

    const dropX = clientX - pageRect.left;
    const dropY = clientY - pageRect.top;

    const widthPx = 150;
    const heightPx = 40;

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
    };

    setFields((prev) => [...prev, newField]);
  };

  // === UPDATE: used by drag + resize and signature ===
  const updateField = (id, partial) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...partial } : f))
    );
  };

  // === Signature modal handlers ===
  const handleStartSign = (fieldId) => {
    setActiveSignatureFieldId(fieldId);
  };

  const handleSaveSignature = (dataUrl) => {
    if (!activeSignatureFieldId) return;
    updateField(activeSignatureFieldId, { signatureDataUrl: dataUrl });
    setActiveSignatureFieldId(null);
  };

  const handleCancelSignature = () => {
    setActiveSignatureFieldId(null);
  };

  const activeSignatureField = fields.find(
    (f) => f.id === activeSignatureFieldId
  );

  return (
    <>
      {/* Left: Palette */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-primary/40 p-4 space-y-4">
        <FieldPalette />
      </aside>

      {/* Right: PDF area */}
      <section
        className="flex-1 overflow-auto p-4"
        ref={containerRef}
      >
        {/* Zoom controls omitted for brevity (same as before) */}

        <div className="flex flex-col items-center gap-6">
          <Document
            file={samplePdf}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="text-sm text-gray-300">Loading PDF…</div>}
          >
            {Array.from(new Array(numPages || 0), (_, index) => (
              <PageView
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                pageIndex={index}
                scale={scale}
                pageMeta={pageMeta}
                onPageLoadSuccess={onPageLoadSuccess}
                fields={fields.filter((f) => f.pageIndex === index)}
                onDropField={handleDropField}
                onUpdateField={updateField}
                onStartSign={handleStartSign}
              />
            ))}
          </Document>
        </div>
      </section>

      {/* Signature modal */}
      {activeSignatureField && (
        <SignatureModal
          field={activeSignatureField}
          onSave={handleSaveSignature}
          onCancel={handleCancelSignature}
        />
      )}
    </>
  );
};

export default PdfEditor;
