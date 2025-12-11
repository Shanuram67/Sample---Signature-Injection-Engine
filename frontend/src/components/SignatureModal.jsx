// src/components/SignatureModal.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";

/**
 * Responsive SignatureModal
 * - canvas resizes to container width and uses devicePixelRatio for crisp strokes.
 * - pointer events friendly (touch / pen / mouse).
 * - prevents page scrolling while drawing by using touch-action and pointer capture.
 *
 * Props:
 * - field: the signature field object (may include id / meta)
 * - onSave(dataUrl)
 * - onCancel()
 */
const SignatureModal = ({ field, onSave, onCancel }) => {
  const sigRef = useRef(null);
  const containerRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ w: 400, h: 160 });

  // update isEmpty whenever signature changes
  const checkEmpty = useCallback(() => {
    const empty = sigRef.current ? sigRef.current.isEmpty() : true;
    setIsEmpty(empty);
  }, []);

  // Resize canvas to container width and apply devicePixelRatio scaling
  const resizeCanvas = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // choose width: 90% of viewport or container width, but not less than 240px
    const maxW = Math.min(window.innerWidth * 0.9, container.clientWidth || 600);
    const w = Math.max(240, Math.floor(maxW));
    // height ratio: keep 16:6 approx or use 160px min
    const h = Math.max(120, Math.round(w * 0.4));

    // store size and update signature pad canvas element
    setCanvasSize({ w, h });

    // If signature canvas exists, adjust actual canvas element for DPR
    const pad = sigRef.current;
    if (pad && pad.getCanvas) {
      const canvasEl = pad.getCanvas();
      const dpr = window.devicePixelRatio || 1;

      // set real pixel size
      canvasEl.width = Math.floor(w * dpr);
      canvasEl.height = Math.floor(h * dpr);

      // set CSS size
      canvasEl.style.width = `${w}px`;
      canvasEl.style.height = `${h}px`;

      // scale context so strokes match size
      const ctx = canvasEl.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      // If there are existing strokes, re-rendering is handled by signature-canvas internally.
    }
  }, []);

  // initialize and attach resize listeners
  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("orientationchange", resizeCanvas);
    };
  }, [resizeCanvas]);

  // When the pad changes (clear/draw), update isEmpty
  // signature-canvas has onEnd/onBegin via props? We'll attach using refs
  useEffect(() => {
    // Some devices may need a small delay to get the canvas
    const pad = sigRef.current;
    if (!pad) return;

    // Wrap methods to detect strokes: we can override onEnd and onBegin by attaching listeners on the canvas
    const canvasEl = pad.getCanvas?.();
    if (!canvasEl) return;

    // pointerdown => user started drawing
    const onPointerDown = () => {
      // mark not empty (once they start)
      setIsEmpty(false);
    };
    // pointerup => could still be empty if quick, but signature-canvas reports isEmpty correctly
    const onPointerUp = () => {
      checkEmpty();
    };

    canvasEl.addEventListener("pointerdown", onPointerDown);
    canvasEl.addEventListener("pointerup", onPointerUp);
    canvasEl.addEventListener("pointercancel", onPointerUp);

    return () => {
      canvasEl.removeEventListener("pointerdown", onPointerDown);
      canvasEl.removeEventListener("pointerup", onPointerUp);
      canvasEl.removeEventListener("pointercancel", onPointerUp);
    };
  }, [checkEmpty]);

  // Clear handler
  const handleClear = () => {
    sigRef.current?.clear();
    setIsEmpty(true);
  };

  // Save handler
  const handleSave = () => {
    const pad = sigRef.current;
    if (!pad) return;
    if (pad.isEmpty && pad.isEmpty()) return; // safety
    // Use PNG to preserve transparency (if needed). You can also use JPEG.
    const dataUrl = pad.toDataURL("image/png");
    onSave && onSave(dataUrl);
  };

  // keyboard ESC to cancel
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel && onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // Prevent background scroll while modal open by setting overflow hidden on body
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Signature modal"
    >
      <div
        ref={containerRef}
        className="bg-white rounded-xl p-4 w-full max-w-2xl mx-auto shadow-lg"
        style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="text-base font-semibold text-black">Sign Document</h3>
            <p className="text-xs text-gray-600">
              Use your finger, stylus, or mouse to sign. Resize the window or rotate the device for a better fit.
            </p>
          </div>
          <div>
            <button
              onClick={onCancel}
              className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
              aria-label="Close signature modal"
            >
              Close
            </button>
          </div>
        </div>

        <div
          className="border border-gray-200 rounded-md bg-white mb-3 touch-none"
          style={{ padding: 8 }}
        >
          {/* SignatureCanvas accepts canvasProps (we set width/height dynamically and pointer events allowed) */}
          <SignatureCanvas
            ref={sigRef}
            penColor="#000000"
            backgroundColor="#ffffff"
            canvasProps={{
              width: canvasSize.w,
              height: canvasSize.h,
              className: "sigCanvas w-full block",
              style: { touchAction: "none" }, // needed to avoid browser scroll while drawing
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-2 rounded-md border border-gray-300 text-sm bg-white hover:bg-gray-50"
              aria-label="Clear signature"
            >
              Clear
            </button>
            <button
              onClick={() => {
                // quick undo: signature-canvas exposes undo? if not, leave clear only
                // placeholder for undo future enhancement
              }}
              className="px-3 py-2 rounded-md border border-gray-300 text-sm bg-white hover:bg-gray-50"
              disabled
            >
              Undo
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-2 rounded-md bg-gray-100 text-sm hover:bg-gray-200"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isEmpty}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                isEmpty ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-[#895AF6] text-white hover:opacity-90"
              }`}
            >
              Save Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
