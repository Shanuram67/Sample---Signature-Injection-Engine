import React from "react";
import PdfEditor from "./components/PdfEditor";

const App = () => {
  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <header className="w-full border-b border-primary/40 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
          Signature Injection Engine – Prototype
        </h1>
        <span className="text-xs md:text-sm text-primary/80">
          Frontend · Responsive PDF Editor
        </span>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        <PdfEditor />
      </main>
    </div>
  );
};

export default App;
