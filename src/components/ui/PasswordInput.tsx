"use client";

import { useState, useCallback } from "react";

interface PasswordInputProps {
  name: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  showStrength?: boolean;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
  if (score <= 2) return { score: 2, label: "Fair", color: "#f97316" };
  if (score <= 3) return { score: 3, label: "Good", color: "#eab308" };
  if (score <= 4) return { score: 4, label: "Strong", color: "#9dfa77" };
  return { score: 5, label: "Very Strong", color: "#22c55e" };
}

export default function PasswordInput({
  name,
  placeholder = "Password *",
  required = true,
  minLength = 6,
  showStrength = false,
  className = "",
  value: controlledValue,
  onChange,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [internalValue, setInternalValue] = useState("");

  const value = controlledValue ?? internalValue;
  const strength = showStrength ? getStrength(value) : null;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (onChange) onChange(v);
      else setInternalValue(v);
    },
    [onChange]
  );

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        value={value}
        onChange={handleChange}
        className={
          className ||
          "w-full border-b border-[var(--color-smoke)] bg-transparent px-2 py-3 pr-12 font-[family-name:var(--font-mono)] text-base text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors"
        }
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-white)]"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>

      {showStrength && value.length > 0 && strength && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor:
                    i <= strength.score ? strength.color : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider"
            style={{ color: strength.color }}
          >
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
}
