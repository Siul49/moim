import { expect, test } from "@playwright/test";

test("host can create a schedule and receive safe participant and host links", async ({
  page,
}) => {
  // 컴파일 및 핫 리로드 속도를 고려하여 타임아웃 연장
  test.slow();

  const testEmail = `test_${Date.now()}@example.com`;
  const testPhone = `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const testNickname = `host_${Date.now().toString().slice(-6)}`;

  // 1. 회원가입 진행
  await page.goto("/signup");

  const phoneInput = page.locator("#phoneNumber");
  await phoneInput.waitFor({ state: "visible", timeout: 10000 });
  await phoneInput.fill(testPhone);
  await expect(phoneInput).toHaveValue(testPhone);

  const nicknameInput = page.locator("#nickname");
  await nicknameInput.fill(testNickname);
  await expect(nicknameInput).toHaveValue(testNickname);

  const pwInput = page.locator("#password");
  await pwInput.waitFor({ state: "visible", timeout: 10000 });
  await pwInput.fill("Test1234!");
  await expect(pwInput).toHaveValue("Test1234!");

  const pwConfirmInput = page.locator("#passwordConfirm");
  await pwConfirmInput.waitFor({ state: "visible", timeout: 10000 });
  await pwConfirmInput.fill("Test1234!");
  await expect(pwConfirmInput).toHaveValue("Test1234!");

  const emailInput = page.locator("#email");
  await emailInput.fill(testEmail);
  await expect(emailInput).toHaveValue(testEmail);

  // WebKit 자동완성 버그 우회: 폼 제출 직전에 비워진 필드들을 검사하고 재기입함
  if ((await phoneInput.inputValue()) !== testPhone) {
    await phoneInput.fill(testPhone);
  }
  if ((await nicknameInput.inputValue()) !== testNickname) {
    await nicknameInput.fill(testNickname);
  }
  if ((await emailInput.inputValue()) !== testEmail) {
    await emailInput.fill(testEmail);
  }
  if ((await pwInput.inputValue()) !== "Test1234!") {
    await pwInput.fill("Test1234!");
  }
  if ((await pwConfirmInput.inputValue()) !== "Test1234!") {
    await pwConfirmInput.fill("Test1234!");
  }

  await page.getByRole("checkbox", { name: /만 14세 이상입니다/ }).check();
  await page.getByRole("checkbox", { name: /이용약관/ }).check();
  await page.getByRole("checkbox", { name: /개인정보수집/ }).check();
  await page.getByRole("button", { name: "회원가입" }).click();
  await expect(page.getByText("회원가입 완료")).toBeVisible({ timeout: 20000 });

  // Webkit 히스토리/라우터 충돌 방지를 위한 컨텍스트 초기화 네비게이션
  await page.goto("about:blank");

  // 2. 로그인 진행
  await page.goto("/login");

  const loginEmailInput = page.locator("#loginId");
  await loginEmailInput.waitFor({ state: "visible", timeout: 10000 });
  await loginEmailInput.fill(testEmail);
  await expect(loginEmailInput).toHaveValue(testEmail);

  const loginPwInput = page.locator("#password");
  await loginPwInput.waitFor({ state: "visible", timeout: 10000 });
  await loginPwInput.fill("Test1234!");
  await expect(loginPwInput).toHaveValue("Test1234!");

  await page.getByRole("button", { name: "로그인" }).click();

  // 3. 스케줄 생성
  await page.waitForURL("**/dashboard", { timeout: 60000 });
  await page.goto("/schedule/create");

  const titleInput = page.getByLabel("모임 제목");
  await titleInput.waitFor({ state: "visible", timeout: 15000 });
  await titleInput.fill("제품 인터뷰");
  await page.getByLabel("예상 소요시간").fill("60");

  // Step 1 -> Step 2 이동
  await page.getByRole("button", { name: "다음 단계로 →" }).click();
  await expect(
    page.getByText("내 일정을 연동해 볼까요?", { exact: true }),
  ).toBeVisible({
    timeout: 5000,
  });

  // Step 2 -> Step 3 이동
  await page.getByRole("button", { name: "다음 단계로 →" }).click();
  await expect(
    page.getByText("조율할 시간 범위를 정해주세요", { exact: true }),
  ).toBeVisible({
    timeout: 5000,
  });

  // Step 3 -> 생성 완료 (초대 링크 만들기)
  await page.getByRole("button", { name: "초대 링크 만들기 🚀" }).click();

  await expect(page.getByText("초대 링크가 준비됐습니다")).toBeVisible();

  const participantLink = await page
    .getByTestId("participant-link")
    .inputValue();
  const hostLink = await page.getByTestId("host-link").inputValue();

  expect(participantLink).toContain("/schedule/");
  expect(participantLink).not.toContain("hostToken=");
  expect(hostLink).toContain("/schedule/");
  expect(hostLink).toContain("hostToken=");

  await page.goto(hostLink);
  await expect(
    page.getByRole("heading", { name: "제품 인터뷰" }),
  ).toBeVisible();
  await expect(page.getByText("아직 제출한 참여자가 없습니다")).toBeVisible({
    timeout: 15000,
  });
});
