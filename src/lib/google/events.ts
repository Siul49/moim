import type { GoogleEvent, GoogleEventInput } from "@/types/google-calendar";

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

/**
 * 특정 캘린더의 이벤트를 기간별로 조회한다.
 */
export async function queryEvents(
  accessToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<GoogleEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true", // 반복 이벤트를 개별 인스턴스로 확장
    orderBy: "startTime",
    maxResults: "250",
  });

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (response.status === 401) {
    throw new Error("Google 인증이 만료되었습니다.");
  }
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`일정 조회 실패 (${response.status}): ${error}`);
  }

  const data = await response.json();

  return (
    (data.items ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => item.status !== "cancelled")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(
        (item: any): GoogleEvent => ({
          id: item.id,
          summary: item.summary ?? "(제목 없음)",
          description: item.description,
          location: item.location,
          start: item.start,
          end: item.end,
          status: item.status,
          htmlLink: item.htmlLink,
        }),
      )
  );
}

/**
 * 캘린더에 새 이벤트를 생성한다.
 */
export async function createEvent(
  accessToken: string,
  calendarId: string,
  input: GoogleEventInput,
): Promise<GoogleEvent> {
  const body = {
    summary: input.summary,
    description: input.description,
    location: input.location,
    start: {
      dateTime: input.startDateTime,
      timeZone: input.timeZone ?? "Asia/Seoul",
    },
    end: {
      dateTime: input.endDateTime,
      timeZone: input.timeZone ?? "Asia/Seoul",
    },
  };

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (response.status === 401) {
    throw new Error("Google 인증이 만료되었습니다.");
  }
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`일정 생성 실패 (${response.status}): ${error}`);
  }

  const item = await response.json();

  return {
    id: item.id,
    summary: item.summary,
    description: item.description,
    location: item.location,
    start: item.start,
    end: item.end,
    status: item.status,
    htmlLink: item.htmlLink,
  };
}
