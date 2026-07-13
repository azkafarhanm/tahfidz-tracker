"use client";

import { useState, type ChangeEvent, type InputHTMLAttributes } from "react";
import { resolveNumericScoreValue } from "@/lib/numeric-score";

type NumericScoreInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "inputMode" | "max" | "min" | "step" | "type" | "value"
> & {
  defaultValue?: number | string;
  value?: number | string;
};

export default function NumericScoreInput({
  defaultValue = "",
  onChange,
  value,
  ...props
}: NumericScoreInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(String(defaultValue));
  const displayedValue = isControlled ? String(value) : internalValue;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = resolveNumericScoreValue(
      event.currentTarget.value,
      displayedValue,
    );
    event.currentTarget.value = nextValue;
    if (!isControlled) setInternalValue(nextValue);
    onChange?.(event);
  }

  return (
    <input
      {...props}
      inputMode="numeric"
      maxLength={3}
      onChange={handleChange}
      pattern="[0-9]*"
      type="text"
      value={displayedValue}
    />
  );
}
