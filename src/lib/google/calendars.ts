import type { GoogleCalendar } from "@/types/google-calendar";

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

/**
 * 사용자의 Google Calendar 목록을 조회한다.
 */
export async function listCalendars(
  accessToken: string,
): Promise<GoogleCalendar[]> {
  const response = await fetch(
    `${CALENDAR_API_BASE}/users/me/calendarList?minAccessRole=writer`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (response.status === 401) {
    throw new Error("Google 인증이 만료되었습니다.");
  }
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`캘린더 목록 조회 실패 (${response.status}): ${error}`);
  }

  const data = await response.json();

  return (data.items ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any): GoogleCalendar => ({
      id: item.id,
      summary: item.summary,
      description: item.description,
      backgroundColor: item.backgroundColor,
      primary: item.primary ?? false,
      accessRole: item.accessRole,
    }),
  );
}
