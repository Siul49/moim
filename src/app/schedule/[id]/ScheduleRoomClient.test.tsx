import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { ScheduleRoomClient } from "./ScheduleRoomClient";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "member@example.com",
            user_metadata: { nickname: "정규호" },
          },
        },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { nickname: "정규호" },
          }),
        }),
      }),
    }),
  }),
}));

const publicSchedule = {
  id: "schedule-1",
  title: "오픈소스 팀플 회의",
  durationMinutes: 85,
  candidateDays: ["MON"],
  candidateStartHour: 9,
  candidateEndHour: 18,
  participantCount: 1,
  status: "open",
  creatorId: "host-1",
};

const resultSchedule = {
  ...publicSchedule,
  participants: [
    {
      id: "participant-1",
      name: "정규호",
      available: [{ day: "MON", startHour: 9, endHour: 11 }],
      submittedAt: new Date("2026-06-15T00:00:00.000Z").toISOString(),
      userId: "user-1",
    },
  ],
  commonSlots: [{ day: "MON", startHour: 9, endHour: 11 }],
};

describe("ScheduleRoomClient 결과 화면 열기", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("제출 완료 화면의 결과 버튼이 같은 URL 이동 대신 결과 데이터를 불러와 현황 화면을 연다", async () => {
    const user = userEvent.setup();
    let scheduleFetchCount = 0;
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockImplementation(async (input) => {
        const url = String(input);
        if (url !== "/api/schedules/schedule-1") {
          return new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        scheduleFetchCount += 1;
        const schedule =
          scheduleFetchCount === 1 ? publicSchedule : resultSchedule;
        return new Response(
          JSON.stringify({
            schedule,
            isHost: false,
            hasSubmittedAvailability: true,
            participantName: "정규호",
            isAuthenticated: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      });

    render(
      <ScheduleRoomClient
        scheduleId="schedule-1"
        hostToken=""
        forceParticipant={false}
      />,
    );

    await screen.findByText(/시간 제출 완료/);
    await user.click(screen.getByRole("button", { name: "결과 화면 열기" }));

    await screen.findByText("일정 조율 현황");
    expect(screen.getAllByText("추천 시간").length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledWith("/api/schedules/schedule-1", {
      cache: "no-store",
    });
  });
});
