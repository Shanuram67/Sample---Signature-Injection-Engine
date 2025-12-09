// src/components/PageView.jsx
import React, { useRef } from "react";
import { Page } from "react-pdf";
import FieldLayer from "./FieldLayer";

const PageView = ({
  pageNumber,
  pageIndex,
  scale,
  pageMeta,
  onPageLoadSuccess,
  fields,
  onDropField,           // function(pageIndex, clientX, clientY, pageRect, fieldType)
  onUpdateField,
  onStartSign,
  // NEW props:
  onDragOverPreview,     // (pageIndex, clientX, clientY, pageRect, fieldType) => void
  onDragLeavePreview,    // () => void
  dragPreview,           // object from parent: { type, pageIndex, leftPx, topPx, widthPx, heightPx }
}) => {
  const pageContainerRef = useRef(null);

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";

    const fieldType = event.dataTransfer.getData("application/field-type");
    if (!fieldType) return;

    const rect = pageContainerRef.current.getBoundingClientRect();
    if (typeof onDragOverPreview === "function") {
      onDragOverPreview(pageIndex, event.clientX, event.clientY, rect, fieldType);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const fieldType = event.dataTransfer.getData("application/field-type");
    if (!fieldType) return;
    const rect = pageContainerRef.current.getBoundingClientRect();
    onDropField(pageIndex, event.clientX, event.clientY, rect, fieldType);
  };

  const handleDragLeave = () => {
    if (typeof onDragLeavePreview === "function") onDragLeavePreview();
  };

  return (
    <div
      ref={pageContainerRef}
      className="relative mb-6 shadow-xl bg-black/40 rounded-md overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      <Page
        pageNumber={pageNumber}
        scale={scale}
        onLoadSuccess={onPageLoadSuccess}
        renderTextLayer={false}
        renderAnnotationLayer={false}
      />

      {pageMeta.widthPt && pageMeta.heightPt && (
        <FieldLayer
          pageMeta={pageMeta}
          scale={scale}
          pageIndex={pageIndex}
          fields={fields}
          onUpdateField={onUpdateField}
          onStartSign={onStartSign}
          dragPreview={dragPreview}    // use the prop passed down
        />
      )}
    </div>
  );
};

export default PageView;
