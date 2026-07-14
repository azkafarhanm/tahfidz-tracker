"use client";

import { useState, type ChangeEvent, type InputHTMLAttributes } from "react";
import { sanitizeNumericInputValue } from "@/lib/numeric-input";

type NumericInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "inputMode" | "max" | "min" | "pattern" | "step" | "type" | "value"
> & {
  defaultValue?: number | string;
  value?: number | string;
};

export default function NumericInput({
  defaultValue = "",
  onChange,
  value,
  ...props
}: NumericInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() =>
    sanitizeNumericInputValue(String(defaultValue)),
  );
  const displayedValue = isControlled
    ? sanitizeNumericInputValue(String(value))
    : internalValue;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = sanitizeNumericInputValue(event.currentTarget.value);
    event.currentTarget.value = nextValue;

    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onChange?.(event);
  }

  return (
    <input
      {...props}
      inputMode="numeric"
      onChange={handleChange}
      pattern="[0-9]*"
      type="text"
      value={displayedValue}
    />
  );
}
