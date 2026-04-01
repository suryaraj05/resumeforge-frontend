"use client";

import React from "react";

interface SuggestedChipsProps {
  chips: string[];
  onSelect: (chip: string) => void;
  compact?: boolean;
}

export function SuggestedChips({ chips, onSelect, compact = false }: SuggestedChipsProps) {
  if (!chips.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "pt-1"}`}>
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className="text-xs px-3 py-1.5 border border-border rounded-full text-ink-muted hover:border-sage/50 hover:bg-sage-light hover:text-sage-dark transition-colors"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
