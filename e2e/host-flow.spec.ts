import { expect, test } from "@playwright/test";

test("host can create a schedule and receive safe participant and host links", async ({
  page,
}) => {
  await page.goto("/schedule/create");

  await page.getByLabel("모임 제목").fill("제품 인터뷰");
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
  expect(hostLink).toContain("hostToken=");

  await page.goto(hostLink);
  await expect(
    page.getByRole("heading", { name: "제품 인터뷰" }),
  ).toBeVisible();
  await expect(page.getByText("아직 제출한 참여자가 없습니다")).toBeVisible();
});
