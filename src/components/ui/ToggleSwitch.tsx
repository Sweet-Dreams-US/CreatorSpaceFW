"use client";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-3"
    >
      <div className="text-left">
        <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
            {description}
          </p>
        )}
      </div>
      <div
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? "bg-[var(--color-coral)]" : "bg-[var(--color-ash)]"
        }`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
