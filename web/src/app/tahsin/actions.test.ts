import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditAction } from "@/generated/prisma-next/enums";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  auditCreate: vi.fn(),
  requireSessionScope: vi.fn(),
  createTahsinRecord: vi.fn(),
  getLatestTahsinForStudent: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("@/lib/session", () => ({ requireSessionScope: mocks.requireSessionScope }));
vi.mock("@/lib/tahsin", () => ({
  createTahsinRecord: mocks.createTahsinRecord,
  getLatestTahsinForStudent: mocks.getLatestTahsinForStudent,
}));

import { createTahsinAction } from "./actions";

const record = {
  id: "tahsin-1", studentId: "student-1", teacherId: "teacher-1", jilid: 1,
  startPage: 5, endPage: null, score: 88, academicYear: "2026/2027",
};

function formData() {
  const data = new FormData();
  for (const [key, value] of Object.entries({ studentId: "student-1", jilid: "1", startPage: "5", score: "88" })) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSessionScope.mockResolvedValue({
    isAdmin: false, teacherId: "teacher-1", session: { user: { id: "user-1" } },
  });
  mocks.createTahsinRecord.mockResolvedValue(record);
  mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  mocks.transaction.mockImplementation(async (callback) => callback({ auditLog: { create: mocks.auditCreate } }));
});

describe("createTahsinAction atomic audit boundary", () => {
  it("returns success only after Tahsin and its CREATE_TAHSIN audit succeed in one transaction", async () => {
    await expect(createTahsinAction(formData())).resolves.toEqual({ ok: true, recordId: "tahsin-1", success: "Penilaian Tahsin tersimpan." });
    expect(mocks.createTahsinRecord).toHaveBeenCalledWith(expect.objectContaining({ teacherId: "teacher-1", isAdmin: false }), expect.any(Object), expect.objectContaining({ auditLog: expect.any(Object) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ action: AuditAction.CREATE_TAHSIN, targetId: "tahsin-1", userId: "user-1" }) });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/tahsin");
  });

  it("returns an error and does not revalidate when audit fails, so Prisma rolls back the transaction", async () => {
    const tx = { auditLog: { create: mocks.auditCreate } };
    mocks.transaction.mockImplementationOnce(async (callback) => callback(tx));
    mocks.auditCreate.mockRejectedValueOnce(new Error("audit failed"));
    await expect(createTahsinAction(formData())).resolves.toEqual({ ok: false, error: "audit failed" });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.createTahsinRecord).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), tx);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
