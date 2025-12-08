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
  onDropField,
  onUpdateField,
  onStartSign,
}) => {
  const pageContainerRef = useRef(null);

  const handleDragOver = (event) => event.preventDefault();

  const handleDrop = (event) => {
    event.preventDefault();
    const fieldType = event.dataTransfer.getData("application/field-type");
    if (!fieldType) return;
    const rect = pageContainerRef.current.getBoundingClientRect();
    onDropField(pageIndex, event.clientX, event.clientY, rect, fieldType);
  };

  return (
    <div
      className="relative mb-6 shadow-xl bg-black/40 rounded-md overflow-hidden"
      ref={pageContainerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
          fields={fields}
          onUpdateField={onUpdateField}
          onStartSign={onStartSign}
        />
      )}
    </div>
  );
};

export default PageView;
