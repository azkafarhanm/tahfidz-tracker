import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

type MessagesObject = Record<string, unknown>;

type ScopedIntlProviderProps = {
  children: ReactNode;
  namespaces: string[];
};

function pickNamespaces(
  messages: MessagesObject,
  namespaces: string[],
): MessagesObject {
  return namespaces.reduce<MessagesObject>((acc, namespace) => {
    const value = messages[namespace];
    if (value !== undefined) {
      acc[namespace] = value;
    }
    return acc;
  }, {});
}

export default async function ScopedIntlProvider({
  children,
  namespaces,
}: ScopedIntlProviderProps) {
  const messages = (await getMessages()) as MessagesObject;

  return (
    <NextIntlClientProvider messages={pickNamespaces(messages, namespaces)}>
      {children}
    </NextIntlClientProvider>
  );
}
