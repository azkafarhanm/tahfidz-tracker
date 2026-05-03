import { RecordStatus } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import {
  formatClassSummary as formatStudentClassSummary,
  statusLabels,
} from "@/lib/format";

export type QuickLogRecordType = "HAFALAN" | "MUROJAAH";

export type QuickLogStudent = {
  id: string;
  fullName: string;
  classSummary: string;
};

export type ParsedQuickLogRecord = {
  student: QuickLogStudent;
  type: QuickLogRecordType;
  surah: string;
  fromAyah: number;
  toAyah: number;
  status: RecordStatus;
  score: number | null;
  notes: string | null;
};

export type QuickLogParseResult =
  | {
      ok: true;
      record: ParsedQuickLogRecord;
    }
  | {
      ok: false;
      errors: string[];
    };

export const quickLogTypeLabels: Record<QuickLogRecordType, string> = {
  HAFALAN: "Hafalan",
  MUROJAAH: "Murojaah",
};

export const quickLogStatusLabels = statusLabels;

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeWords(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function removeMatch(value: string, match: RegExpMatchArray) {
  const index = match.index ?? -1;

  if (index < 0) {
    return value;
  }

  return normalizeSpaces(
    `${value.slice(0, index)} ${value.slice(index + match[0].length)}`,
  );
}

function titleCaseSurah(value: string) {
  return value
    .split(/(\s+|-)/)
    .map((part) =>
      /^[a-z]/i.test(part)
        ? `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}`
        : part,
    )
    .join("");
}

function cleanSurah(value: string) {
  const cleaned = normalizeSpaces(value)
    .replace(/^(surah|surat|qs|q\.s\.)\s+/i, "")
    .replace(/^[,:-]+|[,:-]+$/g, "")
    .trim();

  return titleCaseSurah(cleaned);
}

function studentAliases(student: QuickLogStudent) {
  const parts = student.fullName.split(/\s+/).filter(Boolean);
  const aliases = new Set<string>();

  aliases.add(student.fullName);

  for (let count = Math.min(parts.length, 3); count >= 1; count -= 1) {
    aliases.add(parts.slice(0, count).join(" "));
  }

  return [...aliases]
    .map((alias) => ({
      alias,
      words: normalizeWords(alias).split(" ").filter(Boolean),
    }))
    .filter((alias) => alias.words.length > 0);
}

function wordsStartWith(words: string[], aliasWords: string[]) {
  if (aliasWords.length > words.length) {
    return false;
  }

  return aliasWords.every((word, index) => words[index] === word);
}

function matchStudent(
  value: string,
  students: QuickLogStudent[],
): { student: QuickLogStudent; remaining: string } | { error: string } {
  const rawWords = normalizeSpaces(value).split(/\s+/).filter(Boolean);
  const normalizedWords = normalizeWords(value).split(" ").filter(Boolean);
  const matches = students
    .flatMap((student) =>
      studentAliases(student).map((alias) => ({
        student,
        consumedWords: alias.words.length,
        matches: wordsStartWith(normalizedWords, alias.words),
      })),
    )
    .filter((match) => match.matches)
    .sort((a, b) => b.consumedWords - a.consumedWords);

  if (matches.length === 0) {
    return {
      error: "Nama santri belum terbaca.",
    };
  }

  const best = matches[0];
  const second = matches[1];

  if (!best) {
    return {
      error: "Nama santri tidak ditemukan.",
    };
  }

  if (
    second &&
    second.consumedWords === best.consumedWords &&
    second.student.id !== best.student.id
  ) {
    return {
      error: "Nama santri masih ambigu. Gunakan nama yang lebih lengkap.",
    };
  }

  return {
    student: best.student,
    remaining: rawWords.slice(best.consumedWords).join(" "),
  };
}

function extractNotes(value: string) {
  const match = value.match(/\b(?:catatan|note|notes?)\s*:\s*(.+)$/i);

  if (!match) {
    return { value, notes: null };
  }

  return {
    value: normalizeSpaces(value.slice(0, match.index)),
    notes: match[1].trim() || null,
  };
}

function extractScore(value: string) {
  const match = value.match(/\b(?:nilai|skor|score)\s*[:=]?\s*(\d{1,3})\b/i);

  if (!match) {
    return { value, score: null };
  }

  return {
    value: removeMatch(value, match),
    score: Number.parseInt(match[1], 10),
  };
}

function extractStatus(value: string) {
  const statusPatterns = [
    {
      status: RecordStatus.PERLU_MUROJAAH,
      regex:
        /\b(perlu\s+(?:murojaah|murajaah|review)|belum\s+lancar|ulang)\b/i,
    },
    { status: RecordStatus.LANCAR, regex: /\b(lancar|bagus|mantap)\b/i },
    { status: RecordStatus.CUKUP, regex: /\b(cukup|sedang)\b/i },
  ];

  for (const pattern of statusPatterns) {
    const match = value.match(pattern.regex);

    if (match) {
      return {
        value: removeMatch(value, match),
        status: pattern.status,
      };
    }
  }

  return {
    value,
    status: RecordStatus.CUKUP,
  };
}

function extractType(value: string) {
  const typePatterns = [
    {
      type: "MUROJAAH" as const,
      regex: /\b(murojaah|murajaah|review|revisi)\b/i,
    },
    {
      type: "HAFALAN" as const,
      regex: /\b(hafalan|setoran|ziyadah|baru)\b/i,
    },
  ];

  for (const pattern of typePatterns) {
    const match = value.match(pattern.regex);

    if (match) {
      return {
        value: removeMatch(value, match),
        type: pattern.type,
      };
    }
  }

  return {
    value,
    type: "HAFALAN" as const,
  };
}

function extractRange(value: string) {
  const rangeMatch = value.match(
    /\b(?:ayat\s*)?(\d{1,3})\s*(?:-|to|sd|s\/d|sampai|\u2013|\u2014)\s*(\d{1,3})\b/i,
  );

  if (!rangeMatch) {
    return {
      value,
      fromAyah: null,
      toAyah: null,
    };
  }

  return {
    value: removeMatch(value, rangeMatch),
    fromAyah: Number.parseInt(rangeMatch[1], 10),
    toAyah: Number.parseInt(rangeMatch[2], 10),
  };
}

export async function getQuickLogStudents(teacherId?: string | null) {
  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      ...(teacherId ? { teacherId } : {}),
    },
    include: {
      classGroup: {
        select: { name: true, level: true },
      },
      academicClass: {
        select: { name: true },
      },
    },
    orderBy: { fullName: "asc" },
  });

  return students.map((student) => ({
    id: student.id,
    fullName: student.fullName,
    classSummary: formatStudentClassSummary(student).classSummary,
  }));
}

export function parseQuickLogInput(
  input: string,
  students: QuickLogStudent[],
): QuickLogParseResult {
  let working = normalizeSpaces(input);
  const errors: string[] = [];

  if (!working) {
    return {
      ok: false,
      errors: ["Catatan cepat masih kosong."],
    };
  }

  if (students.length === 0) {
    return {
      ok: false,
      errors: ["Belum ada santri aktif untuk dicatat."],
    };
  }

  const notesResult = extractNotes(working);
  working = notesResult.value;

  const scoreResult = extractScore(working);
  working = scoreResult.value;

  const statusResult = extractStatus(working);
  working = statusResult.value;

  const typeResult = extractType(working);
  working = typeResult.value;

  const rangeResult = extractRange(working);
  working = rangeResult.value;

  if (!rangeResult.fromAyah || !rangeResult.toAyah) {
    errors.push("Rentang ayat belum terbaca.");
  } else if (rangeResult.fromAyah < 1 || rangeResult.toAyah < 1) {
    errors.push("Nomor ayat harus berupa angka positif.");
  } else if (rangeResult.toAyah < rangeResult.fromAyah) {
    errors.push("Ayat akhir tidak boleh lebih kecil dari ayat awal.");
  } else if (rangeResult.toAyah > 286) {
    errors.push("Nomor ayat terlalu besar. Periksa kembali rentangnya.");
  }

  if (
    scoreResult.score !== null &&
    (scoreResult.score < 0 || scoreResult.score > 100)
  ) {
    errors.push("Nilai harus berada di antara 0 sampai 100.");
  }

  const studentMatch = matchStudent(working, students);

  if ("error" in studentMatch) {
    errors.push(studentMatch.error);
  }

  const surah =
    "remaining" in studentMatch ? cleanSurah(studentMatch.remaining) : "";

  if (!surah || surah.length > 80) {
    errors.push("Nama surah wajib terbaca dan maksimal 80 karakter.");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  const fromAyah = rangeResult.fromAyah;
  const toAyah = rangeResult.toAyah;

  if (fromAyah === null || toAyah === null) {
    return {
      ok: false,
      errors: ["Rentang ayat tidak valid."],
    };
  }

  if ("error" in studentMatch) {
    return {
      ok: false,
      errors: [studentMatch.error],
    };
  }

  return {
    ok: true,
    record: {
      student: studentMatch.student,
      type: typeResult.type,
      surah,
      fromAyah,
      toAyah,
      status: statusResult.status,
      score: scoreResult.score,
      notes: notesResult.notes,
    },
  };
}
