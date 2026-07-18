"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

import { MOTION_VARIANTS } from "@/shared/lib/motion";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

export type CustomSelectOption = {
  label: string;
  value: string;
};

type CustomSelectProps = {
  label?: string;
  name?: string;
  value: string;
  options: readonly CustomSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
};

export function CustomSelect({
  label,
  name,
  value,
  options,
  onChange,
  className,
  buttonClassName,
  menuClassName
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 224 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId().replaceAll(":", "");
  const listboxId = `${id}-listbox`;
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedOption = options[selectedIndex] ?? options[0];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(selectedIndex);

    function updateMenuPosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const top = rect.bottom + 8;
      setMenuPosition({
        top,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(44, Math.min(224, window.innerHeight - top - 12))
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, options.length, selectedIndex]);

  useEffect(() => {
    if (isOpen) optionRefs.current[activeIndex]?.focus({ preventScroll: true });
  }, [activeIndex, isOpen]);

  function close(restoreFocus = false) {
    setIsOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function open(index = selectedIndex) {
    setActiveIndex(index);
    setIsOpen(true);
  }

  function select(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    close(true);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open(event.key === "ArrowUp" ? Math.max(0, selectedIndex - 1) : selectedIndex);
    }
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + options.length) % options.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(activeIndex);
    } else if (event.key === "Tab") {
      close();
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {label ? <span id={`${id}-label`} className="block text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</span> : null}
      <button
        ref={triggerRef}
        type="button"
        aria-labelledby={label ? `${id}-label ${id}-value` : `${id}-value`}
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => isOpen ? close() : open()}
        onKeyDown={handleTriggerKeyDown}
        className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 text-left text-sm text-[var(--text-secondary)] transition-[border-color,background-color,color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent,var(--accent))] ${buttonClassName ?? ""}`}
      >
        <span id={`${id}-value`} className="truncate">{selectedOption?.label ?? value}</span>
        <MaterialIcon className={`text-[18px] transition-transform ${isOpen ? "rotate-180" : ""}`} name="keyboard_arrow_down" />
      </button>
      {typeof document !== "undefined" ? createPortal(
        <AnimatePresence>
          {isOpen ? (
            <motion.div
              id={listboxId}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={MOTION_VARIANTS.dropdown}
              style={{ top: menuPosition.top, left: menuPosition.left, width: menuPosition.width, maxHeight: menuPosition.maxHeight, originY: 0 }}
              className={`fixed z-[500] overflow-y-auto rounded-[18px] border border-[var(--line-strong)] bg-[#15161d] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.42)] ${menuClassName ?? ""}`}
              role="listbox"
              aria-labelledby={label ? `${id}-label` : undefined}
              aria-activedescendant={`${id}-option-${activeIndex}`}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <button
                    ref={(node) => { optionRefs.current[index] = node; }}
                    id={`${id}-option-${index}`}
                    key={option.value}
                    type="button"
                    role="option"
                    tabIndex={isActive ? 0 : -1}
                    aria-selected={isSelected}
                    onFocus={() => setActiveIndex(index)}
                    onKeyDown={handleOptionKeyDown}
                    onClick={() => select(index)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-[14px] px-3 py-2 text-left text-sm outline-none transition-[background-color,color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] ${isSelected ? "bg-[var(--accent-soft)] text-[var(--text-primary)]" : isActive ? "bg-[rgba(255,255,255,0.05)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"}`}
                  >
                    <span>{option.label}</span>
                    {isSelected ? <MaterialIcon className="text-[17px] text-[var(--admin-accent-text,var(--accent))]" name="check" /> : null}
                  </button>
                );
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body
      ) : null}
    </div>
  );
}
