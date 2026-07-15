import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAdminReleaseNoteDraft } from "@/lib/admin-release-notes";
import { updateReleaseNoteDraft } from "../../actions";
import ReleaseNoteDraftForm from "../../ReleaseNoteDraftForm";

export const runtime = "nodejs";

type EditReleaseNoteDraftPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(params: Record<string, string | string[] | undefined> | undefined, key: string, fallback: string) {
  const value = params?.[key];
  return typeof value === "string" ? value : fallback;
}

export default async function EditReleaseNoteDraftPage({ params, searchParams }: EditReleaseNoteDraftPageProps) {
  const [{ id }, query, t] = await Promise.all([params, searchParams, getTranslations("AdminReleaseNotes")]);
  const draft = await getAdminReleaseNoteDraft(id);

  if (!draft) redirect("/admin/release-notes");

  return (
    <ReleaseNoteDraftForm
      action={updateReleaseNoteDraft.bind(null, draft.id)}
      error={readParam(query, "error", "") || undefined}
      submitLabel={t("saveChanges")}
      title={t("editDraft")}
      values={{
        applicationVersion: readParam(query, "applicationVersion", draft.applicationVersion),
        title: readParam(query, "title", draft.title),
        summary: readParam(query, "summary", draft.summary),
        content: readParam(query, "content", draft.content),
      }}
    />
  );
}
