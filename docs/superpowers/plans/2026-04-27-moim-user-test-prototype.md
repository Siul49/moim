# MOIM User-Test Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `prototype/moim.html` into a guest-first, user-test-ready prototype covering both host meeting creation and participant invite response flows.

**Architecture:** Keep the current single-file prototype delivery model, but reorganize it around explicit screen states, guest-first entry, reusable save prompts, and simulated recovery/error states. Add a focused Playwright smoke spec that opens the static prototype via `file://` and verifies the most important host and participant paths across desktop and mobile.

**Tech Stack:** Static HTML/CSS/JavaScript in `prototype/moim.html`, Playwright in `e2e/prototype-flow.spec.ts`, existing npm scripts and Playwright configuration.

---

## File Structure

- Modify `prototype/moim.html`: primary prototype UI, styling, state, simulated interactions, responsive behavior.
- Create `e2e/prototype-flow.spec.ts`: smoke coverage for guest-first home, host link creation, participant availability submission, save prompt dismissal, and mobile CTA visibility.
- Reference `docs/superpowers/specs/2026-04-27-moim-user-test-prototype-design.md`: approved design source of truth.

The local `dev` branch currently has the approved spec commit, while `origin/dev` contains the first `prototype/moim.html` commit. Start by merging `origin/dev` into the local branch so the implementation includes both the spec and the prototype file.

---

### Task 1: Synchronize Prototype Baseline

**Files:**
- Modify through git merge: `prototype/moim.html`
- Preserve unrelated working changes: `.agents/docs/1_DOMAIN_CONTEXT.md`, `.agents/docs/2_EXECUTION_PLAN.md`

- [ ] **Step 1: Confirm branch divergence and dirty files**

Run:

```powershell
git status --short --branch
git log --oneline --left-right --graph dev...origin/dev
```

Expected:

```text
## dev...origin/dev [ahead 1, behind 1]
 M .agents/docs/1_DOMAIN_CONTEXT.md
 M .agents/docs/2_EXECUTION_PLAN.md
< c7a0277 docs: 사용자 테스트 프로토타입 설계 문서 추가
> f289732 feat: HTML 프로토타입 초기 작업물 추가
```

- [ ] **Step 2: Merge the remote prototype commit**

Run:

```powershell
git merge --no-edit origin/dev
```

Expected: merge succeeds and adds `prototype/moim.html`. If git reports that `.agents/docs/*` would be overwritten, stop and ask the user before touching those files.

- [ ] **Step 3: Verify prototype file exists**

Run:

```powershell
Test-Path prototype\moim.html
git ls-files prototype/moim.html
```

Expected:

```text
True
prototype/moim.html
```

- [ ] **Step 4: Inspect baseline screen IDs**

Run:

```powershell
Select-String -Path prototype\moim.html -Pattern 'id="s-|function go|function loginEmail|function submitP'
```

Expected: output includes the existing screen IDs `s-landing`, `s-calendar-setup`, `s-main`, `s-host-create`, `s-host-dates`, `s-host-share`, `s-status`, `s-participant`, `s-confirm`, `s-result`, `s-profile`.

---

### Task 2: Add Failing Prototype Smoke Tests

**Files:**
- Create: `e2e/prototype-flow.spec.ts`

- [ ] **Step 1: Write static prototype Playwright tests**

Create `e2e/prototype-flow.spec.ts` with this content:

```ts
import { expect, test } from "@playwright/test";
import { pathToFileURL } from "node:url";
import path from "node:path";

const prototypeUrl = pathToFileURL(
  path.join(process.cwd(), "prototype", "moim.html"),
).toString();

test.describe("MOIM 사용자 테스트용 HTML 프로토타입", () => {
  test("홈은 로그인 게이트보다 모임 만들기와 초대 링크 참여를 먼저 보여준다", async ({
    page,
  }) => {
    await page.goto(prototypeUrl);

    await expect(page.getByRole("heading", { name: "모두의 빈 시간을 링크 하나로 찾기" })).toBeVisible();
    await expect(page.getByRole("button", { name: "모임 만들기" })).toBeVisible();
    await expect(page.getByRole("button", { name: "초대 링크로 참여" })).toBeVisible();
    await expect(page.getByText("로그인하면 다음부터 캘린더 연동 없이 시작할 수 있어요")).toBeVisible();
  });

  test("주최자는 로그인 없이 모임을 만들고 초대 링크를 생성할 수 있다", async ({ page }) => {
    await page.goto(prototypeUrl);

    await page.getByRole("button", { name: "모임 만들기" }).click();
    await expect(page.getByRole("heading", { name: "모임 기본 정보" })).toBeVisible();
    await page.getByRole("textbox", { name: "모임 이름" }).fill("조별과제 회의");
    await page.getByRole("button", { name: "다음" }).click();

    await expect(page.getByRole("heading", { name: "내 일정 반영 방식" })).toBeVisible();
    await page.getByRole("button", { name: "연동 없이 계속" }).click();
    await page.getByRole("button", { name: "후보 시간 선택으로 이동" }).click();

    await expect(page.getByRole("heading", { name: "후보 날짜와 시간" })).toBeVisible();
    await page.getByRole("button", { name: "링크 생성" }).click();

    await expect(page.getByText("계정에 저장하지 않아도 링크를 만들 수 있어요")).toBeVisible();
    await page.getByRole("button", { name: "계속해서 링크 생성" }).click();

    await expect(page.getByRole("heading", { name: "초대 링크가 만들어졌어요" })).toBeVisible();
    await expect(page.getByText("moim.ai/join/abc123xyz")).toBeVisible();
    await expect(page.getByText("다음 모임은 바로 만들 수 있어요")).toBeVisible();
  });

  test("참여자는 로그인 없이 초대 링크에서 가능 시간을 제출할 수 있다", async ({ page }) => {
    await page.goto(`${prototypeUrl}#join`);

    await expect(page.getByRole("heading", { name: "이 모임에 참여할 수 있는 시간을 알려주세요" })).toBeVisible();
    await expect(page.getByText("로그인 없이 제출 가능")).toBeVisible();
    await page.getByRole("button", { name: "직접 입력" }).click();

    await expect(page.getByRole("heading", { name: "가능 시간 확인" })).toBeVisible();
    await page.getByRole("button", { name: "화 4/15 14:00 가능" }).click();
    await page.getByRole("button", { name: "제출하기" }).click();

    await expect(page.getByText("계정 없이도 제출할 수 있어요")).toBeVisible();
    await page.getByRole("button", { name: "그냥 제출" }).click();

    await expect(page.getByRole("heading", { name: "가능 시간이 제출됐어요" })).toBeVisible();
    await expect(page.getByText("다음 초대에서도 자동으로 응답하려면 저장할까요?")).toBeVisible();
  });

  test("참여자는 사진 분석 실패 후 직접 입력으로 회복할 수 있다", async ({ page }) => {
    await page.goto(`${prototypeUrl}#join`);

    await page.getByRole("button", { name: "사진 업로드" }).click();
    await expect(page.getByText("AI가 시간표를 분석하고 있어요")).toBeVisible();
    await page.getByRole("button", { name: "분석 실패 상태 보기" }).click();
    await expect(page.getByText("시간표를 읽지 못했어요")).toBeVisible();
    await page.getByRole("button", { name: "직접 입력으로 계속" }).click();
    await expect(page.getByRole("heading", { name: "가능 시간 확인" })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail against the baseline**

Run:

```powershell
npx playwright test e2e/prototype-flow.spec.ts --project=chromium
```

Expected: FAIL because the baseline home is login-first and does not expose the new headings/buttons.

---

### Task 3: Implement Guest-First Home And Entry Routing

**Files:**
- Modify: `prototype/moim.html`
- Test: `e2e/prototype-flow.spec.ts`

- [ ] **Step 1: Replace the login-first landing screen**

In `prototype/moim.html`, replace the visible contents of `#s-landing` with a guest-first screen that exposes these accessible targets:

```html
<h1>MOIM</h1>
<h2>모두의 빈 시간을 링크 하나로 찾기</h2>
<p>캘린더 연동, 사진 업로드, 직접 입력 중 편한 방식으로 모임 시간을 빠르게 맞춰요.</p>
<button class="btn btn-primary btn-lg btn-full" onclick="startHostFlow()">모임 만들기</button>
<button class="btn btn-secondary btn-lg btn-full" onclick="startParticipantFlow()">초대 링크로 참여</button>
<button class="btn btn-outline btn-full" onclick="showSaveLoginPanel()">로그인하면 다음부터 캘린더 연동 없이 시작할 수 있어요</button>
<div id="save-login-panel" class="card" style="display:none">
  <p>계정에 저장하면 다음 모임부터 캘린더와 위치를 다시 설정하지 않아도 돼요.</p>
  <button class="btn btn-kakao btn-full" onclick="simulateSavedLogin()">카카오로 10초 저장</button>
  <button class="btn btn-outline btn-full" onclick="hideSaveLoginPanel()">나중에 할게요</button>
</div>
```

- [ ] **Step 2: Add entry state helpers**

Add these functions near the existing navigation helpers:

```html
<script>
  const prototypeState = {
    entryMode: "host",
    authSavePrompt: "hidden",
    calendarState: "none",
    uploadState: "idle",
    availabilityState: "empty",
    meetingState: "draft",
  };

  function startHostFlow() {
    prototypeState.entryMode = "host";
    prototypeState.meetingState = "draft";
    go("s-host-create");
  }

  function startParticipantFlow() {
    prototypeState.entryMode = "participant";
    go("s-participant");
  }

  function showSaveLoginPanel() {
    prototypeState.authSavePrompt = "soft";
    document.getElementById("save-login-panel").style.display = "block";
  }

  function hideSaveLoginPanel() {
    prototypeState.authSavePrompt = "dismissed";
    document.getElementById("save-login-panel").style.display = "none";
  }

  function simulateSavedLogin() {
    prototypeState.authSavePrompt = "hidden";
    showToast("다음부터 연동 없이 시작할 수 있어요");
    hideSaveLoginPanel();
  }
</script>
```

If `prototypeState` conflicts with script placement, keep one global object and do not duplicate it.

- [ ] **Step 3: Route `#join` directly to participant flow**

In the `DOMContentLoaded` handler, add:

```js
if (window.location.hash === "#join") {
  startParticipantFlow();
} else {
  go("s-landing", false);
}
```

Expected behavior: opening `prototype/moim.html#join` shows the participant invite screen.

- [ ] **Step 4: Run the home test**

Run:

```powershell
npx playwright test e2e/prototype-flow.spec.ts --project=chromium -g "홈은 로그인 게이트"
```

Expected: PASS.

---

### Task 4: Rework Host Flow For Optional Calendar Setup And Link Creation

**Files:**
- Modify: `prototype/moim.html`
- Test: `e2e/prototype-flow.spec.ts`

- [ ] **Step 1: Rename and simplify host meeting basics**

In `#s-host-create`, make the screen heading accessible as:

```html
<h2>모임 기본 정보</h2>
```

Ensure the meeting-name field has a real label:

```html
<label class="form-label" for="host-meeting-name">모임 이름</label>
<input id="host-meeting-name" class="form-input" aria-label="모임 이름" value="조별과제 회의">
```

Keep duration, participant count, and purpose chips from the existing prototype.

- [ ] **Step 2: Send the host to calendar setup after basics**

Change the primary next button in `#s-host-create` to:

```html
<button class="btn btn-primary btn-full btn-lg" onclick="go('s-calendar-setup')">다음</button>
```

- [ ] **Step 3: Reframe calendar setup as optional**

In `#s-calendar-setup`, change the heading to:

```html
<h2>내 일정 반영 방식</h2>
<p class="section-sub">캘린더를 연동하면 자동으로 막힌 시간이 반영돼요. 지금은 건너뛰고 직접 입력해도 됩니다.</p>
```

Add explicit recovery buttons:

```html
<button class="btn btn-outline btn-full" onclick="simulateCalendarRejected()">권한 거부 상태 보기</button>
<button class="btn btn-secondary btn-full" onclick="skipCalendarSetup()">연동 없이 계속</button>
<button class="btn btn-primary btn-full btn-lg" onclick="go('s-host-dates')">후보 시간 선택으로 이동</button>
```

- [ ] **Step 4: Add calendar setup state functions**

Add:

```js
function simulateCalendarRejected() {
  prototypeState.calendarState = "rejected";
  const notice = document.getElementById("calendar-state-notice");
  if (notice) {
    notice.className = "notice notice-red";
    notice.textContent = "캘린더 권한이 거부됐어요. 다시 시도하거나 직접 입력으로 계속할 수 있어요.";
  }
}

function skipCalendarSetup() {
  prototypeState.calendarState = "skipped";
  const notice = document.getElementById("calendar-state-notice");
  if (notice) {
    notice.className = "notice notice-purple";
    notice.textContent = "연동 없이 계속합니다. 후보 시간은 직접 조정할 수 있어요.";
  }
}
```

Also add a target element inside `#s-calendar-setup`:

```html
<div id="calendar-state-notice" class="notice notice-purple">로그인 없이도 계속할 수 있어요.</div>
```

- [ ] **Step 5: Add pre-link soft save prompt**

In the link generation action from `#s-host-dates`, show a soft prompt instead of navigating immediately:

```js
function showHostLinkSavePrompt() {
  prototypeState.authSavePrompt = "soft";
  const modal = document.getElementById("soft-save-modal");
  modal.querySelector("[data-save-title]").textContent = "계정에 저장하지 않아도 링크를 만들 수 있어요";
  modal.querySelector("[data-save-body]").textContent = "저장하면 다음 모임부터 캘린더 연동을 다시 하지 않아도 됩니다.";
  modal.querySelector("[data-save-primary]").textContent = "저장하고 링크 생성";
  modal.querySelector("[data-save-secondary]").textContent = "계속해서 링크 생성";
  modal.querySelector("[data-save-secondary]").onclick = finishHostLinkCreation;
  modal.style.display = "flex";
}

function finishHostLinkCreation() {
  document.getElementById("soft-save-modal").style.display = "none";
  prototypeState.authSavePrompt = "strong";
  prototypeState.meetingState = "linkCreated";
  go("s-host-share");
}
```

Add a reusable modal near the end of `body`:

```html
<div id="soft-save-modal" class="modal-backdrop" style="display:none">
  <div class="card modal-card">
    <h3 data-save-title></h3>
    <p data-save-body></p>
    <button class="btn btn-primary btn-full" data-save-primary onclick="simulateSavedLogin()">저장하기</button>
    <button class="btn btn-outline btn-full" data-save-secondary>계속하기</button>
  </div>
</div>
```

- [ ] **Step 6: Update host share completion copy**

In `#s-host-share`, use:

```html
<h2>초대 링크가 만들어졌어요</h2>
<div class="link-box">moim.ai/join/abc123xyz</div>
<div class="card">
  <h3>다음 모임은 바로 만들 수 있어요</h3>
  <p>이 캘린더 연동 정보를 계정에 저장하면 다음부터 같은 설정을 반복하지 않아도 됩니다.</p>
  <button class="btn btn-primary btn-full" onclick="simulateSavedLogin()">계정에 저장하기</button>
  <button class="btn btn-outline btn-full" onclick="dismissStrongSavePrompt()">나중에 하기</button>
</div>
```

Add:

```js
function dismissStrongSavePrompt() {
  prototypeState.authSavePrompt = "dismissed";
  showToast("저장하지 않고 계속합니다");
}
```

- [ ] **Step 7: Run host flow test**

Run:

```powershell
npx playwright test e2e/prototype-flow.spec.ts --project=chromium -g "주최자는 로그인 없이"
```

Expected: PASS.

---

### Task 5: Rework Participant Invite And Availability Submission Flow

**Files:**
- Modify: `prototype/moim.html`
- Test: `e2e/prototype-flow.spec.ts`

- [ ] **Step 1: Replace participant entry hierarchy**

In `#s-participant`, ensure the main heading and reassurance are:

```html
<h2>이 모임에 참여할 수 있는 시간을 알려주세요</h2>
<p class="section-sub">조별과제 회의 · 1시간 · 후보 3일 · 마감 4/16</p>
<span class="tag tag-green">로그인 없이 제출 가능</span>
```

Add three response method buttons:

```html
<button class="btn btn-secondary btn-full" onclick="participantConnectCalendar()">캘린더 연동</button>
<button class="btn btn-outline btn-full" onclick="participantUploadPhoto()">사진 업로드</button>
<button class="btn btn-primary btn-full" onclick="participantManualInput()">직접 입력</button>
```

- [ ] **Step 2: Add participant upload failure recovery**

Add a participant upload state panel:

```html
<div id="participant-upload-state" class="card" style="display:none"></div>
```

Add functions:

```js
function participantUploadPhoto() {
  prototypeState.uploadState = "analyzing";
  const panel = document.getElementById("participant-upload-state");
  panel.style.display = "block";
  panel.innerHTML = `
    <h3>AI가 시간표를 분석하고 있어요</h3>
    <p>수업 블록과 고정 일정을 찾는 중입니다.</p>
    <button class="btn btn-outline btn-full" onclick="participantUploadFailed()">분석 실패 상태 보기</button>
  `;
}

function participantUploadFailed() {
  prototypeState.uploadState = "failed";
  const panel = document.getElementById("participant-upload-state");
  panel.innerHTML = `
    <h3>시간표를 읽지 못했어요</h3>
    <p>이미지가 흐리거나 표 영역이 잘렸을 수 있어요.</p>
    <button class="btn btn-secondary btn-full" onclick="participantUploadPhoto()">다시 시도</button>
    <button class="btn btn-primary btn-full" onclick="participantManualInput()">직접 입력으로 계속</button>
  `;
}
```

- [ ] **Step 3: Build availability review screen**

Use the existing `#s-confirm` as the participant review screen. Set its heading and controls:

```html
<h2>가능 시간 확인</h2>
<p class="section-sub">제출 전에 가능한 시간을 확인하고 수정할 수 있어요.</p>
<div class="availability-review-grid">
  <button class="availability-cell" aria-pressed="false" onclick="toggleAvailabilityCell(this)">화 4/15 14:00 가능</button>
  <button class="availability-cell" aria-pressed="false" onclick="toggleAvailabilityCell(this)">수 4/16 14:00 가능</button>
  <button class="availability-cell" aria-pressed="false" onclick="toggleAvailabilityCell(this)">금 4/18 15:00 가능</button>
</div>
<button class="btn btn-primary btn-full btn-lg" onclick="showParticipantSubmitSavePrompt()">제출하기</button>
```

Add:

```js
function participantManualInput() {
  prototypeState.availabilityState = "edited";
  go("s-confirm");
}

function participantConnectCalendar() {
  prototypeState.calendarState = "connected";
  prototypeState.availabilityState = "detected";
  showToast("캘린더에서 가능한 시간이 감지됐어요");
  go("s-confirm");
}

function toggleAvailabilityCell(button) {
  const pressed = button.getAttribute("aria-pressed") === "true";
  button.setAttribute("aria-pressed", String(!pressed));
  button.classList.toggle("on", !pressed);
}
```

- [ ] **Step 4: Add participant pre-submit soft save prompt**

Add:

```js
function showParticipantSubmitSavePrompt() {
  prototypeState.authSavePrompt = "soft";
  const modal = document.getElementById("soft-save-modal");
  modal.querySelector("[data-save-title]").textContent = "계정 없이도 제출할 수 있어요";
  modal.querySelector("[data-save-body]").textContent = "저장하면 다음 초대에서 캘린더를 다시 연동하지 않아도 됩니다.";
  modal.querySelector("[data-save-primary]").textContent = "저장하고 제출";
  modal.querySelector("[data-save-secondary]").textContent = "그냥 제출";
  modal.querySelector("[data-save-secondary]").onclick = finishParticipantSubmit;
  modal.style.display = "flex";
}

function finishParticipantSubmit() {
  document.getElementById("soft-save-modal").style.display = "none";
  prototypeState.availabilityState = "submitted";
  prototypeState.authSavePrompt = "strong";
  go("s-result");
}
```

- [ ] **Step 5: Update participant completion screen**

In `#s-result`, use:

```html
<h2>가능 시간이 제출됐어요</h2>
<p>주최자가 시간을 확정하면 알려드릴게요.</p>
<div class="card">
  <h3>다음 초대에서도 자동으로 응답하려면 저장할까요?</h3>
  <p>캘린더 연동과 기본 정보를 저장하면 다음 모임에서는 더 빠르게 제출할 수 있어요.</p>
  <button class="btn btn-primary btn-full" onclick="simulateSavedLogin()">계정에 저장하기</button>
  <button class="btn btn-outline btn-full" onclick="dismissStrongSavePrompt()">저장하지 않기</button>
</div>
```

- [ ] **Step 6: Run participant flow tests**

Run:

```powershell
npx playwright test e2e/prototype-flow.spec.ts --project=chromium -g "참여자는"
```

Expected: both participant tests PASS.

---

### Task 6: Responsive Polish And Visual Test Pass

**Files:**
- Modify: `prototype/moim.html`
- Test: `e2e/prototype-flow.spec.ts`

- [ ] **Step 1: Add responsive layout rules**

Add or update the responsive CSS near the existing layout styles:

```css
.entry-actions,
.method-grid,
.availability-review-grid {
  display: grid;
  gap: 10px;
}

.method-grid {
  grid-template-columns: 1fr;
}

.availability-review-grid {
  grid-template-columns: 1fr;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  background: rgba(23, 23, 23, 0.24);
}

.modal-card {
  width: 100%;
  max-width: 420px;
}

.availability-cell {
  min-height: 48px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: white;
  font: inherit;
  font-weight: 700;
  color: var(--text-heading);
}

.availability-cell.on,
.availability-cell[aria-pressed="true"] {
  border-color: var(--primary-500);
  background: var(--primary-100);
  color: var(--primary-600);
}

@media (min-width: 768px) {
  .entry-actions {
    grid-template-columns: 1fr 1fr;
  }

  .method-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .availability-review-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .modal-backdrop {
    align-items: center;
  }
}

@media (max-width: 520px) {
  .bottom-bar {
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }

  .container,
  .container-wide {
    padding-left: 16px;
    padding-right: 16px;
  }
}
```

- [ ] **Step 2: Ensure bottom CTAs do not hide content**

For screens with `.bottom-bar`, ensure the main container has:

```html
style="padding-bottom:120px"
```

Expected: the final input/control above the sticky CTA remains visible on mobile.

- [ ] **Step 3: Run full prototype tests on desktop and mobile**

Run:

```powershell
npx playwright test e2e/prototype-flow.spec.ts --project=chromium
npx playwright test e2e/prototype-flow.spec.ts --project="Mobile Safari"
```

Expected: all tests PASS in both projects.

- [ ] **Step 4: Check console errors manually**

Open `prototype/moim.html` in the in-app browser or Playwright and inspect console logs.

Expected: no uncaught JavaScript errors.

---

### Task 7: Manual Visual Verification And Commit

**Files:**
- Modify: `prototype/moim.html`
- Create: `e2e/prototype-flow.spec.ts`

- [ ] **Step 1: Capture desktop screenshots**

Use the in-app browser or Playwright screenshots for:

```text
home
host basic info
host calendar setup
host link created
participant invite
participant review
participant submitted
```

Expected: each screen clearly shows the current step, primary CTA, and optional auth-save guidance where relevant.

- [ ] **Step 2: Capture mobile screenshots**

Use a mobile-width viewport or Mobile Safari project for the same screens.

Expected: no CTA overlaps content, no text is clipped, tap targets are visually large enough.

- [ ] **Step 3: Run final verification**

Run:

```powershell
npm run test
npx playwright test e2e/prototype-flow.spec.ts --project=chromium
npx playwright test e2e/prototype-flow.spec.ts --project="Mobile Safari"
git status --short
```

Expected:

```text
vitest tests pass
prototype Playwright tests pass
git status shows only intended files plus pre-existing .agents/docs changes
```

- [ ] **Step 4: Commit implementation**

Stage only intended implementation files:

```powershell
git add -- prototype/moim.html e2e/prototype-flow.spec.ts
git commit -m "feat: 사용자 테스트용 프로토타입 개선"
```

Expected: commit succeeds. Do not stage `.agents/docs/1_DOMAIN_CONTEXT.md` or `.agents/docs/2_EXECUTION_PLAN.md`.

---

## Self-Review

Spec coverage:

- Guest-first home is covered by Task 3.
- Host first-use journey is covered by Task 4.
- Participant invite response journey is covered by Task 5.
- Soft and strong auth prompts are covered by Tasks 4 and 5.
- Main error and recovery states are covered by Tasks 4 and 5.
- Mobile and desktop responsiveness are covered by Task 6.
- Manual visual/browser verification is covered by Task 7.

Placeholder scan:

- No unresolved placeholder markers or unspecified future work remains in this plan.
- Each implementation step names concrete files, functions, commands, and expected results.

Type and naming consistency:

- The shared state object is consistently named `prototypeState`.
- Save prompt states use `hidden`, `soft`, `strong`, and `dismissed`.
- Calendar states use `none`, `connected`, `rejected`, and `skipped`.
- Upload states use `idle`, `analyzing`, `success`, and `failed`.
- Availability states use `empty`, `detected`, `edited`, and `submitted`.
