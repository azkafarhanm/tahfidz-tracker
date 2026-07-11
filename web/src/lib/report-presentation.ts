const reportCollator = new Intl.Collator("id", {
  numeric: true,
  sensitivity: "base",
});

type ProgressReportStudent = {
  id: string;
  grade: number;
  academicClassName: string;
  fullName: string;
};

export function groupProgressStudentsByGradeAndClass<
  TStudent extends ProgressReportStudent,
>(students: TStudent[]) {
  return [7, 8, 9].flatMap((grade) => {
    const studentsInGrade = students.filter((student) => student.grade === grade);
    if (studentsInGrade.length === 0) return [];

    const studentsByClass = new Map<string, TStudent[]>();
    for (const student of studentsInGrade) {
      const classStudents = studentsByClass.get(student.academicClassName) ?? [];
      classStudents.push(student);
      studentsByClass.set(student.academicClassName, classStudents);
    }

    const classes = Array.from(studentsByClass, ([className, classStudents]) => ({
      className,
      students: classStudents.toSorted(
        (left, right) =>
          reportCollator.compare(left.fullName, right.fullName) ||
          left.id.localeCompare(right.id),
      ),
    })).toSorted((left, right) => reportCollator.compare(left.className, right.className));

    return [{ grade, studentCount: studentsInGrade.length, classes }];
  });
}
