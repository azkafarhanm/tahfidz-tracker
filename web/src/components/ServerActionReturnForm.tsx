"use client";

import { markServerActionReturn } from "@/hooks/usePanelScrollRestoration";

type ServerActionReturnFormProps = React.ComponentProps<"form">;

export default function ServerActionReturnForm({
  onSubmit,
  ...props
}: ServerActionReturnFormProps) {
  return (
    <form
      {...props}
      onSubmit={(event) => {
        markServerActionReturn();
        onSubmit?.(event);
      }}
    />
  );
}
