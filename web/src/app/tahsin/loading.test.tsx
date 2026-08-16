import { describe, expect, it } from "vitest";
import TahsinLoading from "./loading";

describe("Tahsin route loading", () => {
  it("uses the Tahsin skeleton rather than a text-only loading state", () => {
    const loading = TahsinLoading();
    expect(loading.props.kind).toBe("tahsin");
  });
});
