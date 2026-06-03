import { expect, test } from "@playwright/test";
import * as path from "path";

test("user can connect various calendars on the calendar connect page", async ({
  page,
}) => {
  // 컴파일 및 핫 리로드 속도를 고려하여 타임아웃 연장
  test.slow();

  const testEmail = `cal_test_${Date.now()}@example.com`;
  const testPhone = `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. 회원가입 진행
  await page.goto("/signup");
  await page.waitForTimeout(2000);

  const emailInput = page.locator("#email");
  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.fill(testEmail);
  await expect(emailInput).toHaveValue(testEmail);

  const phoneInput = page.locator("#phoneNumber");
  await phoneInput.fill(testPhone);
  await expect(phoneInput).toHaveValue(testPhone);

  const nicknameInput = page.locator("#nickname");
  await nicknameInput.fill(`host_${Date.now().toString().slice(-6)}`);

  const pwInput = page.locator('input[type="password"]').first();
  await pwInput.fill("Test1234!");
  await expect(pwInput).toHaveValue("Test1234!");

  const pwConfirmInput = page.locator('input[type="password"]').last();
  await pwConfirmInput.fill("Test1234!");
  await expect(pwConfirmInput).toHaveValue("Test1234!");

  await page.getByRole("checkbox", { name: /만 14세 이상입니다/ }).check();
  await page.getByRole("checkbox", { name: /이용약관/ }).check();
  await page.getByRole("checkbox", { name: /개인정보수집/ }).check();
  await page.getByRole("button", { name: "회원가입" }).click();
  await expect(page.getByText("회원가입 완료")).toBeVisible({ timeout: 20000 });

  await page.waitForTimeout(2000);
  await page.goto("about:blank");

  // 2. 로그인 진행
  await page.goto("/login");
  await page.waitForTimeout(2000);

  const loginEmailInput = page.locator("#loginId");
  await loginEmailInput.waitFor({ state: "visible", timeout: 10000 });
  await loginEmailInput.fill(testEmail);

  const loginPwInput = page.locator("#password");
  await loginPwInput.fill("Test1234!");

  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL("**/schedule/create", { timeout: 60000 });

  // 3. 캘린더 연동 페이지 이동
  await page.goto("/calendar/connect");
  await page.waitForTimeout(2000);

  // 4. Google 캘린더 연동 링크 검증
  const googleLink = page.locator('a[href="/api/google/auth"]');
  await expect(googleLink).toBeVisible();

  // 5. iCloud 캘린더 연동 검증 (Mocking)
  await page.route("**/api/icloud/connect", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        connectionId: "mock-icloud-conn-id",
        principalUrl: "https://principal.icloud.com",
        calendarHomeUrl: "https://home.icloud.com",
        calendarsCount: 2,
      }),
    });
  });

  const appleIdInput = page.locator('input[placeholder="user@icloud.com"]');
  const appPasswordInput = page.locator('input[placeholder="앱 전용 암호"]');
  await appleIdInput.fill("testuser@icloud.com");
  await appPasswordInput.fill("abcd-efgh-ijkl-mnop");
  await page.getByRole("button", { name: "확인" }).click();

  await expect(
    page.getByText("iCloud 캘린더 연결을 확인했습니다."),
  ).toBeVisible({
    timeout: 15000,
  });

  // 6. Everytime URL 연동 검증 (Mocking)
  await page.route("**/api/everytime/timetable", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        timetable: {
          title: "내 시간표",
          events: [],
        },
        freeSlots: [
          { day: "MON", startHour: 10, endHour: 12 },
          { day: "WED", startHour: 14, endHour: 16 },
        ],
      }),
    });
  });

  const everytimeInput = page.locator(
    'input[placeholder="https://everytime.kr/@..."]',
  );
  await everytimeInput.fill("https://everytime.kr/@testschedule");
  await page.getByRole("button", { name: "가져오기" }).click();

  await expect(
    page.getByText("Everytime 시간표를 가능한 시간으로 변환했습니다."),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("MON 10:00-12:00")).toBeVisible();
  await expect(page.getByText("WED 14:00-16:00")).toBeVisible();

  // 7. .ics 파일 업로드 연동 검증 (Mocking)
  // 새 route를 덮어씌워 ics에 맞는 응답 제공
  await page.route("**/api/everytime/timetable", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        timetable: {
          title: "ICS 시간표",
          events: [],
        },
        freeSlots: [{ day: "FRI", startHour: 15, endHour: 17 }],
      }),
    });
  });

  const fileInput = page.locator('input[type="file"]');
  const sampleIcsPath = path.resolve(__dirname, "mocks", "sample.ics");
  await fileInput.setInputFiles(sampleIcsPath);

  await expect(
    page.getByText("ICS 파일을 가능한 시간으로 변환했습니다."),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("FRI 15:00-17:00")).toBeVisible();
});
