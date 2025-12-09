// src/components/FieldLayer.jsx
import React from "react";
import FieldBox from "./FieldBox";

const FieldLayer = ({
  pageMeta,
  scale,
  fields = [],
  pageIndex,
  onUpdateField,
  onStartSign,
  dragPreview
}) => {
  if (!pageMeta.widthPt || !pageMeta.heightPt) return null;

  const viewportHeightPx = pageMeta.heightPt * scale;

  return (
    <div className="absolute inset-0 pointer-events-auto">

      {/* ─── Render all actual fields ─────────────────────────────── */}
      {fields.map((field) => {
        const leftPx = field.x * scale;
        const widthPx = field.width * scale;
        const heightPx = field.height * scale;

        const bottomPx = field.y * scale;
        const topPx = viewportHeightPx - (bottomPx + heightPx);

        return (
          <FieldBox
            key={field.id}
            field={field}
            leftPx={leftPx}
            topPx={topPx}
            widthPx={widthPx}
            heightPx={heightPx}
            scale={scale}
            viewportHeightPx={viewportHeightPx}
            onUpdateField={onUpdateField}
            onStartSign={onStartSign}
          />
        );
      })}

      {/* ─── LIVE DRAG PREVIEW BOX (Your requested code) ────────── */}
      {dragPreview && dragPreview.pageIndex === pageIndex && (
        <div
          className="
            absolute border-2 border-dashed border-[#895AF6]
            bg-[#895AF6]/10 rounded-md 
            flex items-center justify-center 
            text-[#895AF6] font-semibold text-xs 
            pointer-events-none
          "
          style={{
            left: dragPreview.leftPx,
            top: dragPreview.topPx,
            width: dragPreview.widthPx,
            height: dragPreview.heightPx,
            zIndex: 999,
          }}
        >
          {dragPreview.type.toUpperCase()}
        </div>
      )}

    </div>
  );
};

export default FieldLayer;
