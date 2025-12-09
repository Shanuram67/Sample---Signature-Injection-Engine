// src/components/FieldPalette.jsx
import React from "react";

const FIELD_TYPES = [
  { type: "text", label: "Text Box" },
  { type: "signature", label: "Signature" },
  { type: "image", label: "Image Box" },
  { type: "date", label: "Date Selector" },
  { type: "radio", label: "Radio" },
];

const FieldPalette = () => {
  const onDragStart = (e, type) => {
    // set data type for drop handler
    e.dataTransfer.setData("application/field-type", type);
    e.dataTransfer.effectAllowed = "copyMove";

    // optional: set a nicer drag image (small invisible canvas)
    const crt = document.createElement("canvas");
    crt.width = 1;
    crt.height = 1;
    // place near cursor
    e.dataTransfer.setDragImage(crt, 0, 0);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
          Fields
        </h2>
        <p className="text-xs text-gray-300 mt-1">
          Drag any field onto the PDF.
        </p>
      </div>

      <div className="space-y-2">
        {FIELD_TYPES.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            className="cursor-move rounded-lg border border-primary/60 bg-surface px-3 py-2 text-sm flex items-center justify-between hover:bg-primary/20 transition"
          >
            <span>{item.label}</span>
            <span className="text-[10px] uppercase tracking-widest text-primary">
              drag
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldPalette;
