// src/components/PageView.jsx
import React, { useRef, useEffect } from "react";
import { Page } from "react-pdf";
import FieldLayer from "./FieldLayer";

const PageView = ({
  pageNumber,
  pageIndex,
  scale,
  pageMeta,
  onPageLoadSuccess,
  fields,
  onDropField, // function(pageIndex, clientX, clientY, pageRect, fieldType)
  onUpdateField,
  onStartSign,
  // NEW props:
  onDragOverPreview, // (pageIndex, clientX, clientY, pageRect, fieldType) => void
  onDragLeavePreview, // () => void
  dragPreview, // object from parent: { type, pageIndex, leftPx, topPx, widthPx, heightPx }
  // Mobile tap hook (optional)
  onPageTap,
  mobileSelectedTool,
}) => {
  const pageContainerRef = useRef(null);

  // ---------- existing desktop drag handlers ----------
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

  // ---------- TOUCH / CUSTOM PALETTE-DRAG integration ----------
  useEffect(() => {
    const el = pageContainerRef.current;
    if (!el) return;

    // compute whether a point is inside the page rect, and call preview/drop
    const tryPreviewFromGlobal = (clientX, clientY, type) => {
      const rect = el.getBoundingClientRect();
      // if outside the page element, call dragLeave
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        if (typeof onDragLeavePreview === "function") onDragLeavePreview();
        return;
      }
      if (typeof onDragOverPreview === "function") {
        onDragOverPreview(pageIndex, clientX, clientY, rect, type);
      }
    };

    const handlePaletteDragStart = (e) => {
      const { type, clientX, clientY } = e.detail || {};
      if (!type) return;
      // call preview once
      tryPreviewFromGlobal(clientX, clientY, type);
    };

    const handlePaletteDragMove = (e) => {
      const { type, clientX, clientY } = e.detail || {};
      if (!type) return;
      tryPreviewFromGlobal(clientX, clientY, type);
    };

    const handlePaletteDragEnd = (e) => {
      const { type, clientX, clientY } = e.detail || {};
      // When drag ends, if it ended over this page, treat as drop
      const rect = el.getBoundingClientRect();
      // if client coords undefined, try center of rect
      const x = typeof clientX === "number" ? clientX : rect.left + rect.width / 2;
      const y = typeof clientY === "number" ? clientY : rect.top + rect.height / 2;

      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        if (typeof onDropField === "function") {
          onDropField(pageIndex, x, y, rect, type);
        }
      } else {
        if (typeof onDragLeavePreview === "function") onDragLeavePreview();
      }
    };

    // Page tap (for mobile tap-to-place)
    const handlePagePointerUp = (ev) => {
      // support pointer events and fallback to mouse/touch
      let clientX = ev.clientX;
      let clientY = ev.clientY;
      if (!clientX && ev.changedTouches && ev.changedTouches[0]) {
        clientX = ev.changedTouches[0].clientX;
        clientY = ev.changedTouches[0].clientY;
      }
      if (typeof onPageTap === "function") {
        const rect = el.getBoundingClientRect();
        onPageTap(pageIndex, clientX, clientY, rect);
      }
    };

    window.addEventListener("palette-drag-start", handlePaletteDragStart);
    window.addEventListener("palette-drag-move", handlePaletteDragMove);
    window.addEventListener("palette-drag-end", handlePaletteDragEnd);

    // also support touchend/click inside page to place (for tap-to-place fallback)
    el.addEventListener("pointerup", handlePagePointerUp);
    el.addEventListener("touchend", handlePagePointerUp);

    return () => {
      window.removeEventListener("palette-drag-start", handlePaletteDragStart);
      window.removeEventListener("palette-drag-move", handlePaletteDragMove);
      window.removeEventListener("palette-drag-end", handlePaletteDragEnd);

      el.removeEventListener("pointerup", handlePagePointerUp);
      el.removeEventListener("touchend", handlePagePointerUp);
    };
  }, [pageIndex, onDragOverPreview, onDragLeavePreview, onDropField, onPageTap]);

  return (
    <div
      ref={pageContainerRef}
      className="relative mb-6 shadow-xl bg-black rounded-md overflow-hidden"
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
          dragPreview={dragPreview}
        />
      )}
    </div>
  );
};

export default PageView;
