import { z } from "zod";

export const dayCodeSchema = z.enum([
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
]);

export const timeSlotSchema = z
  .object({
    day: dayCodeSchema,
    startHour: z
      .number()
      .int()
      .min(0)
      .max(23, "시작 시간은 0시에서 23시 사이여야 합니다."),
    endHour: z
      .number()
      .int()
      .min(1)
      .max(24, "종료 시간은 1시에서 24시 사이여야 합니다."),
  })
  .refine((data) => data.startHour < data.endHour, {
    message: "종료 시간은 시작 시간보다 커야 합니다.",
    path: ["endHour"],
  });

export const createScheduleSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "제목은 2자 이상이어야 합니다.")
      .max(80, "제목은 80자 이하여야 합니다."),
    durationMinutes: z
      .number()
      .int()
      .min(15, "소요 시간은 최소 15분 이상이어야 합니다.")
      .max(480, "소요 시간은 최대 480분 이하이어야 합니다."),
    candidateDays: z
      .array(dayCodeSchema)
      .min(1, "후보 요일은 최소 1개 이상 선택해야 합니다."),
    candidateStartHour: z
      .number()
      .int()
      .min(0)
      .max(24, "시작 시간은 0시에서 24시 사이여야 합니다."),
    candidateEndHour: z
      .number()
      .int()
      .min(0)
      .max(24, "종료 시간은 0시에서 24시 사이여야 합니다."),
    candidateStartDate: z.string().optional(),
    candidateEndDate: z.string().optional(),
    responseDeadline: z.string().optional(),
  })
  .refine((data) => data.candidateStartHour < data.candidateEndHour, {
    message: "종료 시간은 시작 시간보다 커야 합니다.",
    path: ["candidateEndHour"],
  })
  .refine(
    (data) =>
      (data.candidateEndHour - data.candidateStartHour) * 60 >=
      data.durationMinutes,
    {
      message: "소요 시간이 후보 시간 범위보다 클 수 없습니다.",
      path: ["durationMinutes"],
    },
  );

export const confirmScheduleSchema = z.object({
  confirmedSlot: timeSlotSchema,
  hostToken: z.string().optional(),
});
