// src/components/FieldBox.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Rnd } from "react-rnd";

// Define default props to simplify the component signature
const typeLabelMap = {
  text: "TEXT",
  signature: "SIGN",
  image: "IMG",
  date: "DATE",
  radio: "RADIO",
};

const FieldBox = ({ 
  field = {}, 
  leftPx = 0, 
  topPx = 0, 
  widthPx = 100, 
  heightPx = 40, 
  scale = 1, 
  viewportHeightPx = 0, 
  onUpdateField = () => {}, 
  onStartSign = () => {} 
}) => {
  const [position, setPosition] = useState({ x: leftPx, y: topPx });
  const [size, setSize] = useState({ width: widthPx, height: heightPx });

  // 1. Keep local state in sync when parent props change (zoom/scale)
  useEffect(() => {
    setPosition({ x: leftPx, y: topPx });
    setSize({ width: widthPx, height: heightPx });
  }, [leftPx, topPx, widthPx, heightPx]);

  // 2. Memoize the PDF coordinate conversion logic
  const commitToPdfCoords = useCallback((xPx, yPx, wPx, hPx) => {
    // Convert px -> PDF points (bottom-left origin)
    const xPdf = xPx / scale;
    const widthPdf = wPx / scale;
    const heightPdf = hPx / scale;
    const bottomPx = yPx + hPx;
    const yPdf = (viewportHeightPx - bottomPx) / scale;

    onUpdateField(field.id, { x: xPdf, y: yPdf, width: widthPdf, height: heightPdf });
  }, [field.id, onUpdateField, scale, viewportHeightPx]); // Dependencies

  // 3. Memoize Rnd handlers for drag and resize
  const handleDragStop = useCallback((e, d) => {
    setPosition({ x: d.x, y: d.y });
    commitToPdfCoords(d.x, d.y, size.width, size.height);
  }, [commitToPdfCoords, size.width, size.height]);
  
  const handleResizeStop = useCallback((e, direction, ref, delta, newPos) => {
    const newW = parseFloat(ref.style.width);
    const newH = parseFloat(ref.style.height);
    setSize({ width: newW, height: newH });
    setPosition({ x: newPos.x, y: newPos.y });
    commitToPdfCoords(newPos.x, newPos.y, newW, newH);
  }, [commitToPdfCoords]);


  return (
    <Rnd
      size={{ width: size.width, height: size.height }}
      position={{ x: position.x, y: position.y }}
      onDrag={(e, d) => setPosition({ x: d.x, y: d.y })}
      onDragStop={handleDragStop}
      onResize={(e, direction, ref, delta, newPos) => {
        const newW = parseFloat(ref.style.width);
        const newH = parseFloat(ref.style.height);
        setSize({ width: newW, height: newH });
        setPosition({ x: newPos.x, y: newPos.y });
      }}
      onResizeStop={handleResizeStop}
      bounds="parent"
      className="pointer-events-auto"
      // Added missing Rnd props for full functionality (based on standard Rnd use)
      enableResizing={{
        bottomRight: true, bottomLeft: true, topRight: true, topLeft: true,
        right: true, left: true, top: true, bottom: true,
      }}
      dragHandleClassName="field-drag-handle"
    >
      {/* 🛑 DELETION BUTTON PLACEMENT (CORRECT JSX LOCATION) */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent drag/resize from starting
          const ok = window.confirm(`Delete the ${field.type.toUpperCase()} field?`);
          if (ok) onUpdateField(field.id, { _delete: true }); // Parent handles deletion
        }}
        // Styles to make it small, visible, and sit on top of the box
        className="absolute top-1 right-1 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold z-50 opacity-80 hover:opacity-100 transition-opacity"
        title="Delete field"
      >
        ✕
      </button>

      {/* Main Field Content */}
      <div 
        className="w-full h-full border border-primary bg-primary/10 rounded-md text-xs flex items-center justify-center select-none relative"
      >
        {field.type === "signature" && field.signatureDataUrl ? (
          <img src={field.signatureDataUrl} alt="sig" className="w-full h-full object-contain" />
        ) : (
          <span>{typeLabelMap[field.type] || field.type.toUpperCase()}</span>
        )}

        {/* Double-click area for signatures */}
        <div 
            className="field-drag-handle absolute inset-0"
            style={{ cursor: "move" }}
            onDoubleClick={() => field.type === "signature" && onStartSign(field.id)} 
        />
      </div>
    </Rnd>
  );
};

export default FieldBox;