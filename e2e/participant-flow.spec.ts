import { expect, test } from "@playwright/test";

test("participant can submit availability from an invite link and host can confirm a common slot", async ({
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

  await page.goto(created.participantPath, { timeout: 20000 });
  await expect(page.getByRole("heading", { name: "스터디 모임" })).toBeVisible({
    timeout: 20000,
  });

  await page.getByLabel("이름").fill("민지");
  await page.locator('[data-slot-key="MON-10"]').click();
  await page.locator('[data-slot-key="MON-11"]').click();
  await page.getByRole("button", { name: "가능 시간 제출" }).click();

  await expect(page.getByText("시간 제출 완료! 🎉")).toBeVisible({
    timeout: 15000,
  });

  await page.goto(created.hostPath);
  await expect(page.getByText("민지", { exact: true })).toBeVisible({
    timeout: 15000,
  });
  await expect(
    page.getByTestId("common-slots").getByText("월요일 10:00-12:00"),
  ).toBeVisible();

  const commonSlots = page.getByTestId("common-slots");
  const targetSlot = commonSlots
    .getByRole("listitem")
    .filter({ hasText: "월요일 10:00-12:00" });
  await targetSlot.getByRole("button", { name: "이 시간 확정" }).click();
  await expect(page.getByText("시간이 확정되었습니다")).toBeVisible();
});
