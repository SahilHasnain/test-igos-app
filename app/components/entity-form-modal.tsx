"use client";

import { useState, useCallback, type FormEvent, type ReactNode } from "react";

export function EntityFormModal({
  title,
  onClose,
  onSubmit,
  submitLabel = "Save",
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  children: ReactNode;
}) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit();
    } finally {
      setSaving(false);
    }
  }, [onSubmit]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form
        className="modal entity-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entity-form-title"
        onSubmit={handleSubmit}
        onMouseDown={e => e.stopPropagation()}
      >
        <button type="button" className="close" aria-label="Close" onClick={onClose}>×</button>
        <p className="eyebrow">Form</p>
        <h2 id="entity-form-title">{title}</h2>
        {children}
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label>
      {label}{required && " *"}
      {children}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <Field label={label} required={required}>
      <input
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  required,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label} required={required}>
      <input
        type="number"
        required={required}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
      />
    </Field>
  );
}

export function DateField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const dateValue = value ? value.slice(0, 10) : "";
  return (
    <Field label={label} required={required}>
      <input
        type="date"
        required={required}
        value={dateValue}
        onChange={e => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")}
      />
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  required?: boolean;
}) {
  return (
    <Field label={label} required={required}>
      <select required={required} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
        ))}
      </select>
    </Field>
  );
}

export function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="check-field">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  required,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Field label={label} required={required}>
      <textarea
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </Field>
  );
}

export function TagInputField({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: readonly string[];
  onChange: (v: readonly string[]) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={label} required={required}>
      <input
        required={required && value.length === 0}
        value={value.join(", ")}
        onChange={e => {
          const raw = e.target.value;
          const tags = raw.split(",").map(s => s.trim()).filter(Boolean);
          onChange(tags);
        }}
        placeholder={placeholder || "Comma-separated"}
      />
    </Field>
  );
}
