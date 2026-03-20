"use client";
import { useState, useRef } from "react";
import MathContent from "./MathContent";

interface MathKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const buttonGroups = [
  {
    label: "Numbers",
    buttons: [
      { label: "7", insert: "7" }, { label: "8", insert: "8" }, { label: "9", insert: "9" },
      { label: "4", insert: "4" }, { label: "5", insert: "5" }, { label: "6", insert: "6" },
      { label: "1", insert: "1" }, { label: "2", insert: "2" }, { label: "3", insert: "3" },
      { label: "0", insert: "0" }, { label: ".", insert: "." }, { label: "−", insert: "-" },
    ],
  },
  {
    label: "Operations",
    buttons: [
      { label: "+", insert: "+" },
      { label: "−", insert: "-" },
      { label: "×", insert: "\\times " },
      { label: "÷", insert: "\\div " },
      { label: "=", insert: "=" },
      { label: "≠", insert: "\\neq " },
      { label: "<", insert: "<" },
      { label: ">", insert: ">" },
      { label: "≤", insert: "\\leq " },
      { label: "≥", insert: "\\geq " },
      { label: "(", insert: "(" },
      { label: ")", insert: ")" },
    ],
  },
  {
    label: "Fractions & Mixed",
    buttons: [
      { label: "a/b", insert: "\\frac{}{}", cursor: -1 },
      { label: "1½", insert: " \\frac{}{}", cursor: -1 },
      { label: "½", insert: "\\frac{1}{2}" },
      { label: "⅓", insert: "\\frac{1}{3}" },
      { label: "¼", insert: "\\frac{1}{4}" },
      { label: "¾", insert: "\\frac{3}{4}" },
    ],
  },
  {
    label: "Powers & Roots",
    buttons: [
      { label: "x²", insert: "^{2}" },
      { label: "x³", insert: "^{3}" },
      { label: "xⁿ", insert: "^{}" , cursor: -1 },
      { label: "√", insert: "\\sqrt{}", cursor: -1 },
      { label: "∛", insert: "\\sqrt[3]{}", cursor: -1 },
      { label: "x₁", insert: "_{}", cursor: -1 },
    ],
  },
  {
    label: "Number Bases",
    buttons: [
      { label: "₂", insert: "_{2}" },
      { label: "₈", insert: "_{8}" },
      { label: "₁₆", insert: "_{16}" },
      { label: "A", insert: "A" },
      { label: "B", insert: "B" },
      { label: "C", insert: "C" },
      { label: "D", insert: "D" },
      { label: "E", insert: "E" },
      { label: "F", insert: "F" },
    ],
  },
  {
    label: "Geometry",
    buttons: [
      { label: "°", insert: "^{\\circ}" },
      { label: "π", insert: "\\pi" },
      { label: "∠", insert: "\\angle " },
      { label: "△", insert: "\\triangle " },
      { label: "⊥", insert: "\\perp " },
      { label: "∥", insert: "\\parallel " },
    ],
  },
  {
    label: "Vectors & Matrices",
    buttons: [
      { label: "→a", insert: "\\vec{}", cursor: -1 },
      { label: "|a|", insert: "|{}|", cursor: -1 },
      { label: "[a b]", insert: "\\begin{pmatrix} {} & {} \\end{pmatrix}", cursor: -1 },
      { label: "[a/b]", insert: "\\begin{pmatrix} {} \\\\ {} \\end{pmatrix}", cursor: -1 },
      { label: "2×2", insert: "\\begin{pmatrix} {} & {} \\\\ {} & {} \\end{pmatrix}", cursor: -1 },
    ],
  },
  {
    label: "Letters",
    buttons: [
      { label: "x", insert: "x" }, { label: "y", insert: "y" }, { label: "z", insert: "z" },
      { label: "a", insert: "a" }, { label: "b", insert: "b" }, { label: "n", insert: "n" },
      { label: "θ", insert: "\\theta " }, { label: "α", insert: "\\alpha " }, { label: "β", insert: "\\beta " },
    ],
  },
];

export default function MathKeyboard({ value, onChange, placeholder }: MathKeyboardProps) {
  const [activeGroup, setActiveGroup] = useState("Numbers");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (insert: string, cursorOffset?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + insert);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + insert + value.substring(end);
    onChange(newValue);

    // Move cursor inside braces if needed
    const newCursor = cursorOffset !== undefined
      ? start + insert.length + cursorOffset
      : start + insert.length;

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const handleBackspace = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value.slice(0, -1));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end && start > 0) {
      const newValue = value.substring(0, start - 1) + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start - 1, start - 1);
      }, 0);
    } else if (start !== end) {
      const newValue = value.substring(0, start) + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start);
      }, 0);
    }
  };

  const currentGroup = buttonGroups.find((g) => g.label === activeGroup);

  return (
    <div className="w-full">
      {/* Rendered Answer Display */}
<div
  onClick={() => { setShowKeyboard(true); textareaRef.current?.focus(); }}
  className="w-full min-h-[56px] border-2 border-brand-400 rounded-lg px-4 py-3 bg-white cursor-text flex items-center"
>
  {value ? (
    <MathContent>{value.includes("$") ? value : `$${value}$`}</MathContent>
  ) : (
    <span className="text-gray-400 text-sm">{placeholder || "Tap buttons below or type your answer..."}</span>
  )}
</div>

{/* Hidden textarea for keyboard input */}
<textarea
  ref={textareaRef}
  value={value}
  onChange={(e) => onChange(e.target.value)}
  onFocus={() => setShowKeyboard(true)}
  rows={1}
  className="w-full border border-gray-200 rounded-lg px-3 py-1 text-gray-500 text-xs font-mono mt-1 resize-none focus:outline-none focus:border-brand-300"
  placeholder="Raw input (advanced)"
/>

      {/* Toggle Keyboard */}
      <button
        type="button"
        onClick={() => setShowKeyboard((s) => !s)}
        className="mt-2 text-xs text-brand-600 font-semibold hover:text-brand-800 underline"
      >
        {showKeyboard ? "Hide math keyboard" : "Show math keyboard"}
      </button>

      {/* Keyboard */}
      {showKeyboard && (
        <div className="mt-2 border border-gray-200 rounded-xl bg-gray-50 p-3">

          {/* Group Tabs */}
          <div className="flex gap-1 flex-wrap mb-3">
            {buttonGroups.map((g) => (
              <button
                key={g.label}
                type="button"
                onClick={() => setActiveGroup(g.label)}
                className={`px-2 py-1 rounded text-xs font-semibold transition ${
                  activeGroup === g.label
                    ? "bg-brand-700 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-brand-300"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {currentGroup?.buttons.map((btn, i) => (
              <button
                key={i}
                type="button"
                onClick={() => insertAtCursor(btn.insert, btn.cursor)}
                className="bg-white border border-gray-200 rounded-lg py-3 text-sm font-semibold text-gray-700 hover:bg-brand-50 hover:border-brand-300 active:bg-brand-100 transition shadow-sm"
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Backspace & Clear */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBackspace}
              className="flex-1 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg py-2 text-sm font-bold hover:bg-yellow-100 transition"
            >
              ⌫ Backspace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex-1 bg-red-50 border border-red-200 text-red-600 rounded-lg py-2 text-sm font-bold hover:bg-red-100 transition"
            >
              ✕ Clear
            </button>
          </div>

        </div>
      )}
    </div>
  );
}