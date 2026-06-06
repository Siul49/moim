import { expect, test } from "@playwright/test";

test("host can create a schedule and receive safe participant and host links", async ({
  page,
}) => {
  // 컴파일 및 핫 리로드 속도를 고려하여 타임아웃 연장
  test.slow();

  const testEmail = `test_${Date.now()}@example.com`;
  const testPhone = `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. 회원가입 진행
  await page.goto("/signup");

  // React Hydration 안정화를 위해 페이지 로드 후 대기
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

  // 리다이렉션 인터럽트 및 클라이언트 상태 안정을 위한 충분한 대기
  await page.waitForTimeout(2000);

  // Webkit 히스토리/라우터 충돌 방지를 위한 컨텍스트 초기화 네비게이션
  await page.goto("about:blank");

  // 2. 로그인 진행
  await page.goto("/login");

  // 로그인 페이지 Hydration 안정 대기
  await page.waitForTimeout(2000);

  const loginEmailInput = page.locator("#loginId");
  await loginEmailInput.waitFor({ state: "visible", timeout: 10000 });
  await loginEmailInput.fill(testEmail);
  await expect(loginEmailInput).toHaveValue(testEmail);

  const loginPwInput = page.locator("#password");
  await loginPwInput.fill("Test1234!");
  await expect(loginPwInput).toHaveValue("Test1234!");

  await page.getByRole("button", { name: "로그인" }).click();

  // 3. 스케줄 생성
  await page.waitForURL("**/schedule/create", { timeout: 60000 });

  // 페이지 컴파일 및 Hydration 안정을 위해 대기
  await page.waitForTimeout(3000);

  const titleInput = page.getByLabel("모임 제목");
  await titleInput.waitFor({ state: "visible", timeout: 15000 });
  await titleInput.fill("제품 인터뷰");
  await page.getByLabel("소요 시간").selectOption("60");
  await page.getByRole("checkbox", { name: "월요일" }).check();
  await page.getByLabel("시작 시간").selectOption("10");
  await page.getByLabel("종료 시간").selectOption("18");
  await page.getByRole("button", { name: "초대 링크 만들기" }).click();

  await expect(page.getByText("초대 링크가 준비됐습니다")).toBeVisible();

  const participantLink = await page
    .getByTestId("participant-link")
    .inputValue();
  const hostLink = await page.getByTestId("host-link").inputValue();

  expect(participantLink).toContain("/schedule/");
  expect(participantLink).not.toContain("hostToken=");
  expect(hostLink).toContain("/schedule/");
  expect(hostLink).not.toContain("hostToken=");

  await page.goto(hostLink);
  await expect(
    page.getByRole("heading", { name: "제품 인터뷰" }),
  ).toBeVisible();
  await expect(page.getByText("아직 제출한 참여자가 없습니다")).toBeVisible({
    timeout: 15000,
  });
});
