"use client";

import { useEffect, useRef, useState } from "react";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type CustomSelectOption = {
  label: string;
  value: string;
};

type CustomSelectProps = {
  label?: string;
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  menuClassName?: string;
};

export function CustomSelect({
  label,
  value,
  options,
  onChange,
  className,
  menuClassName
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative space-y-1.5 ${className ?? ""}`}>
      {label ? (
        <span className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {label}
        </span>
      ) : null}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-full cursor-pointer items-center justify-between rounded-xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 text-left text-sm text-[var(--text-secondary)] transition-[border-color,background-color,color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
      >
        <span>{selectedOption?.label ?? value}</span>
        <MaterialIcon
          className="text-[16px] text-[var(--text-muted)]"
          name={isOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
        />
      </button>
      {isOpen ? (
        <div
          className={`absolute top-full right-0 left-0 z-[80] mt-2 max-h-56 overflow-y-auto rounded-[18px] border border-[var(--line-strong)] bg-[#15161d] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.42)] ${menuClassName ?? ""}`}
          role="listbox"
          aria-label={label}
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center rounded-[14px] px-3 py-2 text-sm transition-[background-color,color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] ${
                  isSelected
                    ? "bg-[var(--accent-soft)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
