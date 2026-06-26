import { describe, expect, it, vi, beforeEach } from "vitest";
import { clearCache } from "./cache";
import { getStudentDetailData } from "./students";
import { prisma } from "./prisma";

vi.mock("./prisma", () => ({
  prisma: {
    student: {
      findUnique: vi.fn(),
    },
    academicYear: {
      findFirst: vi.fn(),
    },
  },
}));

describe("getStudentDetailData", () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
    vi.mocked(prisma.academicYear.findFirst).mockResolvedValue({
      year: "2027/2028",
    } as never);
  });

  it("returns null if the student does not exist", async () => {
    vi.mocked(prisma.student.findUnique).mockResolvedValue(null);

    const result = await getStudentDetailData("non-existent");
    expect(result).toBeNull();
  });

  it("returns isUnauthorized: true if a teacher tries to access a student they do not own", async () => {
    vi.mocked(prisma.student.findUnique).mockResolvedValue({
      id: "student-1",
      isActive: true,
      teacherId: "teacher-owner",
      fullName: "Test Student",
      classGroup: { academicYear: "2027/2028" },
    } as unknown as never);

    const result = await getStudentDetailData("student-1", "teacher-other");
    expect(result).toEqual({ isUnauthorized: true });
  });

  it("returns isInactive details if the student is inactive and accessed by the supervising teacher", async () => {
    vi.mocked(prisma.student.findUnique).mockResolvedValue({
      id: "student-1",
      isActive: false,
      teacherId: "teacher-owner",
      fullName: "Test Student",
      classGroup: { academicYear: "2027/2028" },
    } as unknown as never);

    const result = await getStudentDetailData("student-1", "teacher-owner");
    expect(result).toEqual({
      isInactive: true,
      id: "student-1",
      fullName: "Test Student",
      isOwnStudent: true,
    });
  });

  it("returns isInactive details if the student is inactive and accessed by an admin (no teacherId)", async () => {
    vi.mocked(prisma.student.findUnique).mockResolvedValue({
      id: "student-1",
      isActive: false,
      teacherId: "teacher-owner",
      fullName: "Test Student",
      classGroup: { academicYear: "2027/2028" },
    } as unknown as never);

    const result = await getStudentDetailData("student-1", null);
    expect(result).toEqual({
      isInactive: true,
      id: "student-1",
      fullName: "Test Student",
      isOwnStudent: true,
    });
  });
});
