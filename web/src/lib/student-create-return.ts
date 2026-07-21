type StudentDirectoryContext = {
  grade: string;
  page: string;
  programType: string;
  query: string;
};

export function normalizeAcademicDirectoryGrade(
  programType: string,
  grade: string,
): string {
  return programType === "ACADEMIC" && ["7", "8", "9"].includes(grade)
    ? grade
    : "";
}

export function applyStudentDirectoryContext(
  params: URLSearchParams,
  context: StudentDirectoryContext,
): URLSearchParams {
  if (context.query) params.set("q", context.query);
  if (context.page) params.set("page", context.page);

  const grade = normalizeAcademicDirectoryGrade(
    context.programType,
    context.grade,
  );
  if (grade) params.set("grade", grade);

  return params;
}
