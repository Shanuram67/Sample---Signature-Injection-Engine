import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

const SignatureModal = ({ field, onSave, onCancel }) => {
  const sigRef = useRef(null);

  const handleClear = () => {
    sigRef.current?.clear();
  };

  const handleSave = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    const dataUrl = sigRef.current.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-surface border border-primary/60 rounded-xl p-4 w-[90vw] max-w-md">
        <h3 className="text-sm md:text-base font-semibold mb-2">
          Sign Field – {field.id}
        </h3>
        <p className="text-xs text-gray-300 mb-3">
          Draw your signature below. Double-click the signature field again if
          you want to change it later.
        </p>

        <div className="border border-primary/60 rounded-md overflow-hidden bg-white mb-3">
          <SignatureCanvas
            ref={sigRef}
            penColor="#000"
            backgroundColor="#FFFFFF"
            canvasProps={{
              width: 400,
              height: 160,
              className: "sigCanvas block",
            }}
          />
        </div>

        <div className="flex justify-between items-center gap-2 text-xs md:text-sm">
          <button
            onClick={handleClear}
            className="px-3 py-1 rounded bg-surface border border-primary/40 hover:bg-primary/30 transition"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1 rounded bg-surface border border-primary/40 hover:bg-primary/20 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 rounded bg-primary text-black font-semibold hover:bg-primary/80 transition"
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
