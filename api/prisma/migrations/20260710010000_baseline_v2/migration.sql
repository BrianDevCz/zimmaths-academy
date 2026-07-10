-- CreateEnum
CREATE TYPE "SyllabusType" AS ENUM ('A', 'B', 'BOTH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "grade" TEXT,
    "school" TEXT,
    "avatarColour" TEXT NOT NULL DEFAULT '#1976D2',
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'student',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),
    "verifyToken" TEXT,
    "verifyTokenExp" TIMESTAMP(3),
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "activeSyllabus" "SyllabusType" NOT NULL DEFAULT 'B',
    "syllabusChoice" "SyllabusType"[] DEFAULT ARRAY['B']::"SyllabusType"[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "paidReferrals" INTEGER NOT NULL,
    "rewardMonths" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paymentReference" TEXT,
    "amountUsd" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "syllabusPoints" JSONB,
    "orderIndex" INTEGER NOT NULL,
    "icon" TEXT,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "syllabus" "SyllabusType" NOT NULL DEFAULT 'BOTH',

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paper" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "session" TEXT NOT NULL,
    "paperNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "difficultyOverall" TEXT NOT NULL DEFAULT 'medium',
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "totalMarks" INTEGER,
    "questionCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syllabus" "SyllabusType" NOT NULL DEFAULT 'B',
    "syllabusCode" TEXT,

    CONSTRAINT "Paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "paperId" TEXT,
    "questionNumber" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionImageUrl" TEXT,
    "marks" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "topicId" TEXT NOT NULL,
    "subtopic" TEXT,
    "solutionText" TEXT,
    "solutionSteps" JSONB,
    "videoUrl" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "isDailyEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correctAnswer" TEXT,
    "syllabus" "SyllabusType" NOT NULL DEFAULT 'B',
    "solutionImageUrl" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 10,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "videoUrl" TEXT,
    "geogebraUrl" TEXT,
    "imageUrl" TEXT,
    "syllabus" "SyllabusType" NOT NULL DEFAULT 'B',

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeTest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'mixed',
    "questionCount" INTEGER NOT NULL,
    "scorePercentage" DOUBLE PRECISION NOT NULL,
    "timeTakenSeconds" INTEGER,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionsData" JSONB,

    CONSTRAINT "PracticeTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctAttempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallengeAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyChallengeId" TEXT NOT NULL,
    "userAnswer" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyChallengeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPoint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeSlug" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiChatUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AiChatUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppPost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "posted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playing_with_neon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" REAL,

    CONSTRAINT "playing_with_neon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_activeSyllabus_idx" ON "User"("activeSyllabus");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_referredId_idx" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE INDEX "ReferralReward_userId_idx" ON "ReferralReward"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_expiresAt_idx" ON "Subscription"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Paper_isFree_idx" ON "Paper"("isFree");

-- CreateIndex
CREATE INDEX "Paper_title_idx" ON "Paper"("title");

-- CreateIndex
CREATE INDEX "Paper_syllabus_idx" ON "Paper"("syllabus");

-- CreateIndex
CREATE INDEX "Question_topicId_idx" ON "Question"("topicId");

-- CreateIndex
CREATE INDEX "Question_paperId_idx" ON "Question"("paperId");

-- CreateIndex
CREATE INDEX "Question_isFree_idx" ON "Question"("isFree");

-- CreateIndex
CREATE INDEX "Question_isDailyEligible_idx" ON "Question"("isDailyEligible");

-- CreateIndex
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");

-- CreateIndex
CREATE INDEX "Question_syllabus_idx" ON "Question"("syllabus");

-- CreateIndex
CREATE INDEX "Lesson_topicId_idx" ON "Lesson"("topicId");

-- CreateIndex
CREATE INDEX "Lesson_orderIndex_idx" ON "Lesson"("orderIndex");

-- CreateIndex
CREATE INDEX "Lesson_syllabus_idx" ON "Lesson"("syllabus");

-- CreateIndex
CREATE INDEX "PracticeTest_userId_idx" ON "PracticeTest"("userId");

-- CreateIndex
CREATE INDEX "PracticeTest_topicId_idx" ON "PracticeTest"("topicId");

-- CreateIndex
CREATE INDEX "PracticeTest_completedAt_idx" ON "PracticeTest"("completedAt");

-- CreateIndex
CREATE INDEX "PracticeTest_scorePercentage_idx" ON "PracticeTest"("scorePercentage");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_date_key" ON "DailyChallenge"("date");

-- CreateIndex
CREATE INDEX "DailyChallenge_date_idx" ON "DailyChallenge"("date");

-- CreateIndex
CREATE INDEX "DailyChallengeAttempt_userId_idx" ON "DailyChallengeAttempt"("userId");

-- CreateIndex
CREATE INDEX "DailyChallengeAttempt_dailyChallengeId_idx" ON "DailyChallengeAttempt"("dailyChallengeId");

-- CreateIndex
CREATE INDEX "DailyChallengeAttempt_attemptedAt_idx" ON "DailyChallengeAttempt"("attemptedAt");

-- CreateIndex
CREATE INDEX "UserPoint_userId_idx" ON "UserPoint"("userId");

-- CreateIndex
CREATE INDEX "UserPoint_awardedAt_idx" ON "UserPoint"("awardedAt");

-- CreateIndex
CREATE INDEX "UserPoint_source_idx" ON "UserPoint"("source");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_badgeSlug_idx" ON "UserBadge"("badgeSlug");

-- CreateIndex
CREATE INDEX "Bookmark_userId_idx" ON "Bookmark"("userId");

-- CreateIndex
CREATE INDEX "Bookmark_questionId_idx" ON "Bookmark"("questionId");

-- CreateIndex
CREATE INDEX "UserLessonProgress_userId_idx" ON "UserLessonProgress"("userId");

-- CreateIndex
CREATE INDEX "UserLessonProgress_lessonId_idx" ON "UserLessonProgress"("lessonId");

-- CreateIndex
CREATE INDEX "AiChatUsage_userId_idx" ON "AiChatUsage"("userId");

-- CreateIndex
CREATE INDEX "AiChatUsage_date_idx" ON "AiChatUsage"("date");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeTest" ADD CONSTRAINT "PracticeTest_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeTest" ADD CONSTRAINT "PracticeTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallenge" ADD CONSTRAINT "DailyChallenge_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeAttempt" ADD CONSTRAINT "DailyChallengeAttempt_dailyChallengeId_fkey" FOREIGN KEY ("dailyChallengeId") REFERENCES "DailyChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeAttempt" ADD CONSTRAINT "DailyChallengeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPoint" ADD CONSTRAINT "UserPoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiChatUsage" ADD CONSTRAINT "AiChatUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

