# 4. API Response Formats

캘린더 연동 3종(에브리타임, Google Calendar, iCloud CalDAV)의 요청/응답 형식을 정리한다.
모든 API는 JSON을 기본 응답 형식으로 사용하며, 에러 응답은 `{ "error": string }` 형태로 통일된다.

---

## 공통 타입

```typescript
// 요일 코드 — 스케줄링 도메인 전반에서 사용
type DayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

// 빈 시간 슬롯 — 세 연동 모두 최종적으로 이 형태로 변환됨
interface TimeSlot {
  day: DayCode;
  startHour: number; // 0-23
  endHour: number;   // 0-23, startHour보다 커야 함
}
```

---

## 1. 에브리타임 (Everytime)

### `POST /api/everytime/timetable`

에브리타임 공유 URL 또는 ICS 파일로 시간표를 받아 빈 시간(`TimeSlot[]`)으로 변환한다.

#### 방법 A — 공유 URL

**Request**
```
Content-Type: application/json

{
  "url": "https://everytime.kr/@XXXX"
}
```

Query parameter (선택): `?days=MON,WED,FRI` (기본값: 월~금)

#### 방법 B — ICS 파일 업로드

**Request**
```
Content-Type: multipart/form-data

file: <.ics 파일>
```

#### Response `200`

```typescript
{
  timetable: {
    lectures: Array<{
      name: string;
      times: Array<{
        day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=월, 1=화, ..., 6=일
        startMinute: number; // 자정 기준 분 (예: 540 = 09:00)
        endMinute: number;   // 자정 기준 분 (예: 705 = 11:45)
      }>;
    }>;
  };
  freeSlots: TimeSlot[];
}
```

> **시간 단위**: 에브리타임 API의 `starttime` / `endtime` 값 × 5 = 자정 기준 분  
> 예) `starttime=108` → 108 × 5 = 540분 = 09:00

#### 에러 응답

| 상태코드 | 사유 |
|---|---|
| `400` | url 필드 누락, ICS 파일 미첨부, 파일 형식 오류 |
| `415` | Content-Type이 json/multipart 외의 값 |
| `422` | 유효하지 않은 에브리타임 URL, ICS 파싱 실패 |
| `500` | 서버 내부 오류 |

---

## 2. Google Calendar

### `GET /api/google/calendars`

연결된 Google 계정의 캘린더 목록을 반환한다.

#### Response `200`

```typescript
{
  calendars: Array<{
    id: string;
    summary: string;
    description?: string;
    backgroundColor?: string;
    primary?: boolean;
    accessRole: string;
  }>;
}
```

---

### `GET /api/google/events/query`

특정 캘린더의 기간별 일정을 조회한다.

**Query parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `calendarId` | string | ✅ | 캘린더 ID |
| `startDate` | string | ✅ | ISO 8601 (예: `2026-05-01T00:00:00Z`) |
| `endDate` | string | ✅ | ISO 8601, startDate보다 이후 |

#### Response `200`

```typescript
{
  events: Array<{
    id: string;
    summary: string;
    description?: string;
    location?: string;
    start: {
      dateTime?: string; // ISO 8601 (시간 있는 이벤트)
      date?: string;     // YYYY-MM-DD (종일 이벤트)
      timeZone?: string;
    };
    end: {
      dateTime?: string;
      date?: string;
      timeZone?: string;
    };
    status: string;
    htmlLink?: string;
  }>;
}
```

---

### `POST /api/google/events/create`

**Request**
```typescript
{
  calendarId: string;
  summary: string;        // 1-255자
  startDateTime: string;  // ISO 8601 (예: "2026-05-14T10:00:00+09:00")
  endDateTime: string;    // ISO 8601
  timeZone?: string;      // 예: "Asia/Seoul"
  location?: string;      // 최대 500자
  description?: string;   // 최대 8000자
}
```

#### Response `201`

```typescript
{
  event: GoogleEvent; // events/query 응답의 단건 항목과 동일
}
```

#### 에러 응답

| 상태코드 | 사유 |
|---|---|
| `401` | Google 계정 미연결 또는 인증 만료 |
| `400` | 필수 파라미터 누락, 날짜 형식 오류 |
| `502` | Google Calendar API 오류 |

---

## 3. iCloud CalDAV

### `GET /api/icloud/calendars`

연결된 iCloud 계정의 캘린더 목록을 반환한다. DB 캐시 우선, 없으면 CalDAV 서버에서 조회한다.

**Query parameter**: `?connectionId=<UUID>`

#### Response `200`

```typescript
{
  calendars: Array<{
    id: string;          // DB UUID
    displayName: string;
    calendarUrl: string; // CalDAV 캘린더 URL
    color: string | null;
  }>;
  cached: boolean; // true: DB 캐시, false: CalDAV 서버에서 새로 조회
}
```

---

### `POST /api/icloud/events/query`

특정 캘린더의 기간별 일정을 조회한다.

**Request**
```typescript
{
  calendarId: string; // DB UUID
  startDate: string;  // ISO 8601
  endDate: string;    // ISO 8601
}
```

#### Response `200`

```typescript
{
  events: Array<{
    uid: string;
    title: string;
    startAt: string;            // ISO 8601
    endAt: string;              // ISO 8601
    isAllDay: boolean;
    location: string | null;
    description: string | null;
    etag: string;               // CalDAV ETag (캐시 검증용)
  }>;
}
```

---

### `POST /api/icloud/events/create`

**Request**
```typescript
{
  calendarId: string; // DB UUID
  title: string;      // 1-255자
  startAt: string;    // ISO 8601
  endAt: string;      // ISO 8601
  location?: string;  // 최대 500자
  description?: string; // 최대 2000자
}
```

#### Response `201`

```typescript
{
  uid: string;      // 생성된 이벤트 UID
  eventUrl: string; // CalDAV href
  etag: string;     // CalDAV ETag
}
```

#### 에러 응답

| 상태코드 | 사유 |
|---|---|
| `401` | 인증 필요 또는 iCloud 인증 만료 |
| `403` | 캘린더 소유권 불일치 |
| `404` | calendarId 없음 |
| `400` | 입력값 검증 실패 (UUID 형식, 날짜 형식 등) |
| `502` | CalDAV 서버 오류 |

---

## 연동별 비교 요약

| 항목 | 에브리타임 | Google Calendar | iCloud CalDAV |
|---|---|---|---|
| **인증** | 없음 (공개 URL) | OAuth 2.0 (세션 토큰) | Apple ID + 앱 암호 (세션) |
| **시간 형식** | 분 단위 정수 (자정 기준) | ISO 8601 문자열 | ISO 8601 문자열 |
| **요일 표현** | 0~6 정수 (0=월) | 이벤트 날짜에 포함 | 이벤트 날짜에 포함 |
| **종일 이벤트** | 없음 (수업 시간표) | `date` 필드로 구분 | `isAllDay` 플래그 |
| **반복 일정** | 없음 (주간 고정) | recurrence 지원 | 없음 (개별 이벤트 확장) |
| **최종 출력** | `TimeSlot[]` (자동 변환) | `GoogleEvent[]` | `ParsedEvent[]` |
