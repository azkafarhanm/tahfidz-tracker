export const OPTIMISTIC_STUDENT_CHANGE = "optimistic-student-change";

export type StudentChangeEvent = {
  activeDelta: number;
  inactiveDelta: number;
};

export function dispatchStudentChange(activeDelta: number, inactiveDelta: number) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<StudentChangeEvent>(OPTIMISTIC_STUDENT_CHANGE, {
        detail: { activeDelta, inactiveDelta },
      }),
    );
  }
}
