// src/components/FieldPalette.jsx
import React, { useRef } from "react";

const FIELD_TYPES = [
  { type: "text", label: "Text Box" },
  { type: "signature", label: "Signature" },
  { type: "image", label: "Image Box" },
  { type: "date", label: "Date Selector" },
  { type: "radio", label: "Radio" },
];

const createDragImage = () => {
  const crt = document.createElement("canvas");
  crt.width = 1;
  crt.height = 1;
  return crt;
};

const FieldPalette = ({ onToolSelect } = {}) => {
  const touchDragRef = useRef({ active: false, type: null });

  const onDragStart = (e, type) => {
    try {
      e.dataTransfer.setData("application/field-type", type);
      e.dataTransfer.effectAllowed = "copyMove";
      e.dataTransfer.setDragImage(createDragImage(), 0, 0);
    } catch (err) {
      // ignore if dataTransfer not available
    }
  };

  // Touch handlers: no preventDefault here (use CSS touch-action)
  const handleTouchStart = (e, type) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];

    touchDragRef.current = { active: true, type };
    window.dispatchEvent(
      new CustomEvent("palette-drag-start", {
        detail: { type, clientX: touch.clientX, clientY: touch.clientY },
      })
    );

    if (onToolSelect) onToolSelect(type);
  };

  const handleTouchMove = (e) => {
    if (!touchDragRef.current.active || !e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    window.dispatchEvent(
      new CustomEvent("palette-drag-move", {
        detail: { type: touchDragRef.current.type, clientX: touch.clientX, clientY: touch.clientY },
      })
    );
  };

  const handleTouchEnd = (e) => {
    if (!touchDragRef.current.active) return;
    const t = e.changedTouches && e.changedTouches[0];
    const clientX = t ? t.clientX : undefined;
    const clientY = t ? t.clientY : undefined;

    window.dispatchEvent(
      new CustomEvent("palette-drag-end", {
        detail: { type: touchDragRef.current.type, clientX, clientY },
      })
    );

    touchDragRef.current = { active: false, type: null };
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[#895AF6]">
          Fields
        </h2>
        <p className="text-xs text-gray-500 mt-1">Drag any field onto the PDF.</p>
      </div>

      <div className="space-y-2">
        {FIELD_TYPES.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            onTouchStart={(e) => handleTouchStart(e, item.type)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            // touch-none prevents the browser from starting native scroll/pinch gestures for this element
            className="cursor-move rounded-lg border border-[#895AF6]/30 bg-grey px-3 py-2 text-sm flex items-center justify-between hover:bg-[#895AF6]/5 transition touch-none"
          >
            <span>{item.label}</span>
            <span className="text-[10px] uppercase tracking-widest text-[#895AF6]">
              drag
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldPalette;
