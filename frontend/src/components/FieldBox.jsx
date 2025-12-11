// src/components/FieldBox.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Rnd } from "react-rnd";

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
  onStartSign = () => {},
}) => {
  const [position, setPosition] = useState({ x: leftPx, y: topPx });
  const [size, setSize] = useState({ width: widthPx, height: heightPx });

  // MOBILE TAP HANDLER
  const tapTimer = useRef(null);
  const lastTap = useRef(0);

  // Keep synced on scale change
  useEffect(() => {
    setPosition({ x: leftPx, y: topPx });
    setSize({ width: widthPx, height: heightPx });
  }, [leftPx, topPx, widthPx, heightPx]);

  // Convert px → PDF coords
  const commitToPdfCoords = useCallback(
    (xPx, yPx, wPx, hPx) => {
      const xPdf = xPx / scale;
      const widthPdf = wPx / scale;
      const heightPdf = hPx / scale;

      const bottomPx = yPx + hPx;
      const yPdf = (viewportHeightPx - bottomPx) / scale;

      onUpdateField(field.id, { x: xPdf, y: yPdf, width: widthPdf, height: heightPdf });
    },
    [field.id, onUpdateField, scale, viewportHeightPx]
  );

  // DRAG STOP
  const handleDragStop = useCallback(
    (e, d) => {
      setPosition({ x: d.x, y: d.y });
      commitToPdfCoords(d.x, d.y, size.width, size.height);
    },
    [commitToPdfCoords, size.width, size.height]
  );

  // RESIZE STOP
  const handleResizeStop = useCallback(
    (e, direction, ref, delta, newPos) => {
      const newW = parseFloat(ref.style.width);
      const newH = parseFloat(ref.style.height);
      setSize({ width: newW, height: newH });
      setPosition({ x: newPos.x, y: newPos.y });
      commitToPdfCoords(newPos.x, newPos.y, newW, newH);
    },
    [commitToPdfCoords]
  );

  // --- MOBILE: TAP TO OPEN SIGNATURE MODAL ---
  const handleTouchStart = () => {
    const now = Date.now();
    const timeSince = now - lastTap.current;

    if (field.type === "signature" && timeSince < 350) {
      // Detected double-tap
      onStartSign(field.id);
    }

    lastTap.current = now;
  };

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
      enableResizing={{
        bottomRight: true,
        bottomLeft: true,
        topRight: true,
        topLeft: true,
        right: true,
        left: true,
        top: true,
        bottom: true,
      }}
      dragHandleClassName="field-drag-handle"
    >
      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          const ok = window.confirm(`Delete the ${field.type.toUpperCase()} field?`);
          if (ok) onUpdateField(field.id, { _delete: true });
        }}
        className="absolute top-1 right-1 text-xs bg-red-500 text-white rounded-full w-4 h-4 
                   flex items-center justify-center font-bold z-50 opacity-80 hover:opacity-100"
      >
        ✕
      </button>

      {/* FIELD BOX */}
      <div
        className="w-full h-full border border-[#895AF6] bg-[#895AF6]/10 rounded-md 
                   text-[10px] sm:text-xs flex items-center justify-center select-none relative"
        // mobile tap-to-sign
        onTouchStart={handleTouchStart}
      >
        {field.type === "signature" && field.signatureDataUrl ? (
          <img src={field.signatureDataUrl} alt="sig" className="w-full h-full object-contain" />
        ) : (
          <span>{typeLabelMap[field.type]}</span>
        )}

        {/* DRAG SURFACE */}
        <div
          className="field-drag-handle absolute inset-0"
          style={{ cursor: "move", touchAction: "none" }}
          onDoubleClick={() =>
            field.type === "signature" ? onStartSign(field.id) : null
          }
        />
      </div>
    </Rnd>
  );
};

export default FieldBox;
