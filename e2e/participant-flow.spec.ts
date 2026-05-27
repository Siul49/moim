import { expect, test } from "@playwright/test";

test("participant can submit availability from an invite link and host can see it", async ({
  page,
  request,
}) => {
  const createResponse = await request.post("/api/schedules", {
    data: {
      title: "스터디 모임",
      durationMinutes: 60,
      candidateDays: ["MON"],
      candidateStartHour: 10,
      candidateEndHour: 13,
    },
  });
  expect(createResponse.ok()).toBe(true);
  const created = await createResponse.json();

  await page.goto(created.participantPath);
  await expect(
    page.getByRole("heading", { name: "스터디 모임" }),
  ).toBeVisible();

  await page.getByLabel("이름").fill("민지");
  await page.getByRole("checkbox", { name: "월요일 10:00-11:00" }).check();
  await page.getByRole("checkbox", { name: "월요일 11:00-12:00" }).check();
  await page.getByRole("button", { name: "가능 시간 제출" }).click();

  await expect(page.getByText("가능 시간이 제출됐습니다")).toBeVisible();

  await page.goto(created.hostPath);
  await expect(page.getByText("민지")).toBeVisible();
  await expect(
    page.getByTestId("common-slots").getByText("월요일 10:00-12:00"),
  ).toBeVisible();
});
