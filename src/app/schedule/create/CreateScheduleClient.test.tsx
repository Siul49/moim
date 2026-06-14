import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
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
  // Step 1: 필수 소요시간 입력 (#71에서 자유 입력 필드로 변경되어 기본값이 비어 있음)
  await user.type(screen.getByLabelText("예상 소요시간"), "60");
  // Step 1 -> Step 2
  await user.click(screen.getByRole("button", { name: "다음 단계로 →" }));
  // Step 2 -> Step 3
  await user.click(screen.getByRole("button", { name: "다음 단계로 →" }));
  // Step 3 -> Step 4
  await user.click(screen.getByRole("button", { name: "초대 링크 만들기 🚀" }));
  await screen.findByText(/초대 링크가 준비됐습니다/);
}

describe("CreateScheduleClient 복사 피드백", () => {
  let clipboardText = "";
  const mockWriteText = vi.fn();
  const mockReadText = vi.fn();

  function mockClipboard(writeTextImpl: unknown, readTextImpl: unknown) {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: writeTextImpl,
        readText: readTextImpl,
      },
      configurable: true,
      writable: true,
    });
  }

  beforeEach(() => {
    mockSchedulesApi();
    clipboardText = "";
    mockWriteText.mockReset();
    mockReadText.mockReset();

    mockWriteText.mockImplementation(async (text: string) => {
      clipboardText = text;
      return Promise.resolve();
    });
    mockReadText.mockImplementation(async () => {
      return Promise.resolve(clipboardText);
    });

    mockClipboard(mockWriteText, mockReadText);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
    if ("execCommand" in document) {
      delete (document as unknown as Record<string, unknown>).execCommand;
    }
  });

  it("하단 노란 '참여자 링크 복사' 버튼 클릭 시 클립보드에 쓰고 '복사됨'으로 바뀐다", async () => {
    const user = userEvent.setup();
    mockClipboard(mockWriteText, mockReadText);
    render(<CreateScheduleClient />);
    await submitAndWaitForLinks(user);

    const yellowButton = screen.getByTestId("copy-participant-link-bottom");
    await user.click(yellowButton);

    const text = await navigator.clipboard.readText();
    expect(text).toBe(`${window.location.origin}/schedule/${SCHEDULE_ID}`);
    await screen.findByRole("button", { name: "복사됨" });
  });

  it("링크 입력칸 안의 복사 아이콘 클릭 시 클립보드에 쓰고 '복사됨' 상태가 된다", async () => {
    const user = userEvent.setup();
    mockClipboard(mockWriteText, mockReadText);
    render(<CreateScheduleClient />);
    await submitAndWaitForLinks(user);

    const hostCopy = screen.getByRole("button", {
      name: "호스트 결과 링크 복사",
    });
    await user.click(hostCopy);

    const text = await navigator.clipboard.readText();
    expect(text).toBe(`${window.location.origin}/schedule/${SCHEDULE_ID}`);
    await screen.findByRole("button", { name: "호스트 결과 링크 복사됨" });
  });

  it("클립보드 API 실패 시 폴백을 시도하고 실패하면 '복사됨' 상태로 바뀌지 않는다", async () => {
    const user = userEvent.setup();
    mockWriteText.mockImplementation(() =>
      Promise.reject(new Error("Permission denied")),
    );
    mockClipboard(mockWriteText, mockReadText);
    document.execCommand = vi.fn().mockReturnValue(false);

    render(<CreateScheduleClient />);
    await submitAndWaitForLinks(user);

    const yellowButton = screen.getByTestId("copy-participant-link-bottom");
    await user.click(yellowButton);

    expect(
      screen.queryByRole("button", { name: "복사됨" }),
    ).not.toBeInTheDocument();
    expect(yellowButton.textContent).toContain("참여자 링크 복사");
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("클립보드 API 실패 시 execCommand 폴백이 성공하면 '복사됨' 상태로 바뀐다", async () => {
    const user = userEvent.setup();
    mockWriteText.mockImplementation(() =>
      Promise.reject(new Error("Not available")),
    );
    mockClipboard(mockWriteText, mockReadText);
    document.execCommand = vi.fn().mockReturnValue(true);

    render(<CreateScheduleClient />);
    await submitAndWaitForLinks(user);

    const yellowButton = screen.getByTestId("copy-participant-link-bottom");
    await user.click(yellowButton);

    await screen.findByRole("button", { name: "복사됨" });
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("복사 버튼이 resetMs 후 자동으로 초기 상태로 돌아간다", async () => {
    const user = userEvent.setup();
    mockClipboard(mockWriteText, mockReadText);
    render(<CreateScheduleClient />);
    await submitAndWaitForLinks(user);

    vi.useFakeTimers();

    const yellowButton = screen.getByTestId("copy-participant-link-bottom");
    fireEvent.click(yellowButton);

    // Flush promises and react state update
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(yellowButton.textContent).toContain("복사됨");

    // Now advance by the remaining time (e.g. 1800ms) to trigger the reset timeout
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1800);
    });

    expect(yellowButton.textContent).toContain("참여자 링크 복사");

    vi.useRealTimers();
  });
});
