"use client";

import { FILTER_LABELS, FILTER_PRESETS, type FilterKey } from "@/lib/filters";

interface FilterSelectorProps {
  selected: FilterKey;
  onChange: (key: FilterKey) => void;
  disabled?: boolean;
}

export function FilterSelector({
  selected,
  onChange,
  disabled = false,
}: FilterSelectorProps) {
  const keys = Object.keys(FILTER_PRESETS) as FilterKey[];

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {keys.map((key) => {
        const isActive = selected === key;
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(key)}
            className={`cursor-pointer rounded-sm px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
              isActive
                ? "border border-secondary bg-primary text-primary-foreground"
                : "border border-surface-border bg-[#FAF6F0]/80 text-ink hover:border-secondary"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {FILTER_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}
