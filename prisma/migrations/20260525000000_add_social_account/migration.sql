-- AlterTable: User 필드 옵셔널 처리 및 profileCompleted 추가
-- SQLite는 컬럼 타입 변경/NOT NULL 제거를 직접 지원하지 않으므로
-- 테이블 재생성 방식으로 처리

-- 1. 임시 테이블에 기존 데이터 복사
CREATE TABLE "User_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "phoneNumber" TEXT,
    "nickname" TEXT NOT NULL,
    "passwordHash" TEXT,
    "isAgeOver14" BOOLEAN,
    "termsAgreedAt" DATETIME,
    "privacyAgreedAt" DATETIME,
    "marketingAgreed" BOOLEAN NOT NULL DEFAULT false,
    "eventSmsAgreed" BOOLEAN NOT NULL DEFAULT false,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "User_new" (
    "id", "email", "phoneNumber", "nickname", "passwordHash",
    "isAgeOver14", "termsAgreedAt", "privacyAgreedAt",
    "marketingAgreed", "eventSmsAgreed", "createdAt", "updatedAt"
)
SELECT
    "id", "email", "phoneNumber", "nickname", "passwordHash",
    "isAgeOver14", "termsAgreedAt", "privacyAgreedAt",
    "marketingAgreed", "eventSmsAgreed", "createdAt", "updatedAt"
FROM "User";

DROP TABLE "User";
ALTER TABLE "User_new" RENAME TO "User";

-- 2. 인덱스 재생성
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- 3. SocialAccount 테이블 생성
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. SocialAccount 인덱스 생성
CREATE UNIQUE INDEX "SocialAccount_provider_providerUserId_key" ON "SocialAccount"("provider", "providerUserId");
