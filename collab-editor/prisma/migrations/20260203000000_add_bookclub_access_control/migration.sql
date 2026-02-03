-- CreateEnum
CREATE TYPE "ClubVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITE_ONLY');
CREATE TYPE "BookClubRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'BANNED', 'LEFT');
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable: BookClubMember
CREATE TABLE "bookclub_members" (
    "id" TEXT NOT NULL,
    "bookClubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BookClubRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "invitedBy" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookclub_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MembershipRequest
CREATE TABLE "membership_requests" (
    "id" TEXT NOT NULL,
    "bookClubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_requests_pkey" PRIMARY KEY ("id")
);

-- Migrate existing members data from bookclubs.members array to bookclub_members table
-- This creates BookClubMember records for all existing members
DO $$
DECLARE
    club RECORD;
    member_id TEXT;
BEGIN
    FOR club IN SELECT id, members, "creatorId", "createdAt" FROM bookclubs WHERE members IS NOT NULL AND array_length(members, 1) > 0
    LOOP
        FOREACH member_id IN ARRAY club.members
        LOOP
            INSERT INTO "bookclub_members" ("id", "bookClubId", "userId", "role", "status", "joinedAt", "createdAt", "updatedAt")
            VALUES (
                gen_random_uuid(),
                club.id,
                member_id,
                CASE 
                    WHEN member_id = club."creatorId" THEN 'OWNER'::"BookClubRole"
                    ELSE 'MEMBER'::"BookClubRole"
                END,
                'ACTIVE'::"MembershipStatus",
                club."createdAt",
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END LOOP;
END $$;

-- AlterTable bookclubs
ALTER TABLE "bookclubs" 
    ADD COLUMN "description" TEXT,
    ADD COLUMN "visibility" "ClubVisibility" NOT NULL DEFAULT 'PUBLIC',
    ADD COLUMN "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "inviteCode" TEXT;

-- Set visibility based on old isPublic field
UPDATE "bookclubs" 
SET "visibility" = CASE 
    WHEN "isPublic" = true THEN 'PUBLIC'::"ClubVisibility"
    ELSE 'PRIVATE'::"ClubVisibility"
END;

-- Now drop the old columns
ALTER TABLE "bookclubs" 
    DROP COLUMN "isPublic",
    DROP COLUMN "members";

-- CreateIndex
CREATE UNIQUE INDEX "bookclub_members_bookClubId_userId_key" ON "bookclub_members"("bookClubId", "userId");
CREATE INDEX "bookclub_members_bookClubId_status_idx" ON "bookclub_members"("bookClubId", "status");
CREATE INDEX "bookclub_members_userId_idx" ON "bookclub_members"("userId");

CREATE UNIQUE INDEX "membership_requests_bookClubId_userId_key" ON "membership_requests"("bookClubId", "userId");
CREATE INDEX "membership_requests_bookClubId_status_idx" ON "membership_requests"("bookClubId", "status");
CREATE INDEX "membership_requests_userId_idx" ON "membership_requests"("userId");

CREATE UNIQUE INDEX "bookclubs_inviteCode_key" ON "bookclubs"("inviteCode");
CREATE INDEX "bookclubs_visibility_idx" ON "bookclubs"("visibility");

-- DropIndex (old isPublic index)
DROP INDEX IF EXISTS "bookclubs_isPublic_idx";

-- AddForeignKey
ALTER TABLE "bookclub_members" ADD CONSTRAINT "bookclub_members_bookClubId_fkey" FOREIGN KEY ("bookClubId") REFERENCES "bookclubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_bookClubId_fkey" FOREIGN KEY ("bookClubId") REFERENCES "bookclubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
