import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateScheduleClient } from "./CreateScheduleClient";

const SCHEDULE_ID = "abc123token";

function mockSchedulesApi() {
  vi.spyOn(global, "fetch").mockImplementation(
    async () =>
      new Response(
        JSON.stringify({
          schedule: { id: SCHEDULE_ID },
          participantPath: `/schedule/${SCHEDULE_ID}`,
          hostPath: `/schedule/${SCHEDULE_ID}`,
          hostToken: "host-token",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
  );
}

async function submitAndWaitForLinks(user: ReturnType<typeof userEvent.setup>) {
  // Step 1 -> Step 2
  await user.click(screen.getByRole("button", { name: "다음 단계로 →" }));
  // Step 2 -> Step 3
  await user.click(screen.getByRole("button", { name: "다음 단계로 →" }));
  // Step 3 -> Step 4
  await user.click(screen.getByRole("button", { name: "초대 링크 만들기 🚀" }));
  await screen.findByText(/초대 링크가 준비됐습니다/);
}

describe("CreateScheduleClient 복사 피드백", () => {
  beforeEach(() => {
    mockSchedulesApi();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("하단 노란 '참여자 링크 복사' 버튼 클릭 시 클립보드에 쓰고 '복사됨'으로 바뀐다", async () => {
    // userEvent.setup()이 navigator.clipboard를 자체 스텁으로 설치한다.
    const user = userEvent.setup();
    render(<CreateScheduleClient />);
    await submitAndWaitForLinks(user);

    // 참여자 링크 입력칸의 복사 아이콘(aria-label)과 하단 노란 버튼의 텍스트가
    // 같은 접근성 이름을 가지므로, 마지막(하단 노란 버튼)을 선택한다.
    const participantCopyButtons = screen.getAllByRole("button", {
      name: "참여자 링크 복사",
    });
    const yellowButton =
      participantCopyButtons[participantCopyButtons.length - 1];
    await user.click(yellowButton);

    expect(await navigator.clipboard.readText()).toContain(
      `/schedule/${SCHEDULE_ID}`,
    );
    // 노란 버튼만 텍스트가 '복사됨'으로 바뀐다.
    await screen.findByRole("button", { name: "복사됨" });
  });

  it("링크 입력칸 안의 복사 아이콘 클릭 시 클립보드에 쓰고 '복사됨' 상태가 된다", async () => {
    const user = userEvent.setup();
    render(<CreateScheduleClient />);
    await submitAndWaitForLinks(user);

    const hostCopy = screen.getByRole("button", {
      name: "호스트 결과 링크 복사",
    });
    await user.click(hostCopy);

    expect(await navigator.clipboard.readText()).toContain(
      `/schedule/${SCHEDULE_ID}`,
    );
    await screen.findByRole("button", { name: "호스트 결과 링크 복사됨" });
  });
});
