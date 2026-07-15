import type { ReleaseNote } from "@/lib/release-notes";

export type ReleaseNoteGroup = {
  applicationVersion: string;
  notes: ReleaseNote[];
  latestNote: ReleaseNote;
};

const applicationVersionCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function compareChronologically(left: ReleaseNote, right: ReleaseNote) {
  const publishedAtDifference = (left.publishedAt?.getTime() ?? 0) - (right.publishedAt?.getTime() ?? 0);
  if (publishedAtDifference !== 0) return publishedAtDifference;

  const createdAtDifference = left.createdAt.getTime() - right.createdAt.getTime();
  if (createdAtDifference !== 0) return createdAtDifference;

  return left.id.localeCompare(right.id);
}

export function groupReleaseNotes(notes: ReleaseNote[]): ReleaseNoteGroup[] {
  const groupedNotes = new Map<string, ReleaseNote[]>();

  for (const note of [...notes].sort(compareChronologically)) {
    const group = groupedNotes.get(note.applicationVersion) ?? [];
    group.push(note);
    groupedNotes.set(note.applicationVersion, group);
  }

  return [...groupedNotes.entries()]
    .map(([applicationVersion, groupedReleaseNotes]) => ({
      applicationVersion,
      notes: groupedReleaseNotes,
      latestNote: groupedReleaseNotes.at(-1)!,
    }))
    .sort((left, right) => {
      const versionDifference = applicationVersionCollator.compare(
        right.applicationVersion,
        left.applicationVersion,
      );
      if (versionDifference !== 0) return versionDifference;

      return compareChronologically(right.latestNote, left.latestNote);
    });
}
