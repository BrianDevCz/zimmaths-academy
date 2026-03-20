"use client";
import { useState } from "react";

const examples = [
  { label: "Fraction", code: "\\frac{1}{2}" },
  { label: "Square root", code: "\\sqrt{x}" },
  { label: "Power", code: "x^{2}" },
  { label: "Subscript", code: "x_{1}" },
  { label: "Mixed number", code: "2\\frac{1}{3}" },
  { label: "Multiply (times)", code: "\\times" },
  { label: "Divide", code: "\\div" },
  { label: "Pi", code: "\\pi" },
  { label: "Degrees", code: "90^{\\circ}" },
  { label: "Plus/minus", code: "\\pm" },
  { label: "Less/equal", code: "\\leq" },
  { label: "Greater/equal", code: "\\geq" },
  { label: "Infinity", code: "\\infty" },
  { label: "Equation wrap", code: "$...$" },
];

export default function LatexCheatSheet() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-brand-600 hover:text-brand-800 font-semibold underline"
      >
        {open ? "Hide" : "Show"} LaTeX cheat sheet
      </button>
      {open && (
        <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50 grid grid-cols-2 md:grid-cols-3 gap-2">
          {examples.map((ex) => (
            <div key={ex.label} className="flex flex-col">
              <span className="text-xs text-gray-500">{ex.label}</span>
              <code className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 font-mono text-brand-700 select-all">
                {ex.code}
              </code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}