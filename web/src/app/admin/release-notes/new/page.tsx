import { getTranslations } from "next-intl/server";
import { createReleaseNoteDraft } from "../actions";
import ReleaseNoteDraftForm from "../ReleaseNoteDraftForm";

export const runtime = "nodejs";

type NewReleaseNoteDraftPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(params: Record<string, string | string[] | undefined> | undefined, key: string) {
  const value = params?.[key];
  return typeof value === "string" ? value : "";
}

export default async function NewReleaseNoteDraftPage({ searchParams }: NewReleaseNoteDraftPageProps) {
  const [t, params] = await Promise.all([getTranslations("AdminReleaseNotes"), searchParams]);

  return (
    <ReleaseNoteDraftForm
      action={createReleaseNoteDraft}
      error={readParam(params, "error") || undefined}
      submitLabel={t("saveDraft")}
      title={t("newDraft")}
      values={{
        applicationVersion: readParam(params, "applicationVersion"),
        title: readParam(params, "title"),
        summary: readParam(params, "summary"),
        content: readParam(params, "content"),
      }}
    />
  );
}
