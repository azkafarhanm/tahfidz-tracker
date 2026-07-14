"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import SurahInput from "@/components/SurahInput";
import { getJuz, getSurahNamesForJuz } from "@/lib/juz";
import { surahList } from "@/lib/surahs";

type JuzFilter = number | "all";

type JuzFilteredSurahInputProps = {
  defaultFromAyah?: number;
  defaultValue?: string;
  id?: string;
  inputResetKey?: number;
  name?: string;
  required?: boolean;
};

const juzOptions = Array.from({ length: 30 }, (_, index) => 30 - index);

function initialJuz(defaultValue?: string, defaultFromAyah?: number): JuzFilter {
  if (!defaultValue) return 30;
  return getJuz(defaultValue, defaultFromAyah ?? 1) ?? "all";
}

export default function JuzFilteredSurahInput({
  defaultFromAyah,
  defaultValue,
  id,
  inputResetKey,
  name = "surah",
  required = true,
}: JuzFilteredSurahInputProps) {
  const t = useTranslations("SurahInput");
  const [selectedJuz, setSelectedJuz] = useState<JuzFilter>(() =>
    initialJuz(defaultValue, defaultFromAyah),
  );
  const [currentValue, setCurrentValue] = useState(defaultValue ?? "");
  const [inputDefaultValue, setInputDefaultValue] = useState(defaultValue);
  const [inputVersion, setInputVersion] = useState(0);
  const previousResetKey = useRef(inputResetKey);
  const inputId = id ?? name;
  const juzSelectId = `${inputId}-juz`;

  useEffect(() => {
    if (previousResetKey.current === inputResetKey) return;
    previousResetKey.current = inputResetKey;
    setCurrentValue("");
    setInputDefaultValue(undefined);
    setInputVersion((version) => version + 1);
  }, [inputResetKey]);

  const options = useMemo(() => {
    if (selectedJuz === "all") return surahList;
    const names = new Set(getSurahNamesForJuz(selectedJuz));
    return surahList.filter((surah) => names.has(surah.name));
  }, [selectedJuz]);

  const selectedSurah = surahList.find((surah) => surah.name === currentValue);
  const selectionOutsideFilter = Boolean(
    selectedJuz !== "all" &&
      selectedSurah &&
      !options.some((surah) => surah.name === selectedSurah.name),
  );
  const placeholder = selectedJuz === "all"
    ? t("allSurahsPlaceholder")
    : t("placeholderInJuz", { juz: selectedJuz });

  return (
    <div className="space-y-3">
      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          htmlFor={juzSelectId}
        >
          {t("juzLabel")}
        </label>
        <select
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:shadow-none dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
          id={juzSelectId}
          onChange={(event) => {
            const value = event.target.value;
            setSelectedJuz(value === "all" ? "all" : Number(value));
          }}
          value={selectedJuz}
        >
          <option value="all">{t("allSurahs")}</option>
          {juzOptions.map((juz) => (
            <option key={juz} value={juz}>
              {t("juzOption", { juz })}
            </option>
          ))}
        </select>
      </div>

      <SurahInput
        defaultValue={inputDefaultValue}
        id={id}
        key={inputVersion}
        name={name}
        onValueChange={setCurrentValue}
        options={options}
        placeholder={placeholder}
        required={required}
      />

      {selectionOutsideFilter && selectedSurah && selectedJuz !== "all" ? (
        <p aria-live="polite" className="text-xs text-amber-700 dark:text-amber-300">
          {t("selectionKept", { surah: selectedSurah.name, juz: selectedJuz })}
        </p>
      ) : null}
    </div>
  );
}
