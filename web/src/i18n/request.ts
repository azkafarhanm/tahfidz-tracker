import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["id", "en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "id";

const indonesianWorkflowNamespaces = [
  "QuickLog",
  "StudentForm",
  "StudentFormPage",
  "RecordForm",
  "TargetForm",
  "SurahInput",
  "AdminFormPage",
  "AdminTeacherForm",
  "AdminClassForm",
  "AdminHalaqahForm",
  "AdminStudentForm",
  "DeleteTeacher",
  "DeleteRecord",
] as const;

type MessageTree = Record<string, unknown>;

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = (store.get("locale")?.value as Locale) || defaultLocale;
  const messages = {
    ...((await import(`../../messages/${locale}.json`)).default as MessageTree),
  };

  if (locale !== defaultLocale) {
    const indonesianMessages = (await import("../../messages/id.json"))
      .default as MessageTree;

    for (const namespace of indonesianWorkflowNamespaces) {
      if (namespace in indonesianMessages) {
        messages[namespace] = indonesianMessages[namespace];
      }
    }
  }

  return {
    locale,
    messages,
  };
});
