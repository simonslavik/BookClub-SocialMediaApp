-- CreateEnum
CREATE TYPE "BookClubBookStatus" AS ENUM ('current', 'upcoming', 'completed');

-- CreateEnum
CREATE TYPE "UserBookStatus" AS ENUM ('favorite', 'reading', 'want_to_read', 'completed');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('upvote', 'downvote');

-- Add publishedDate to Book
ALTER TABLE "Book" ADD COLUMN "publishedDate" TEXT;

-- Drop percentage from ReadingProgress
ALTER TABLE "ReadingProgress" DROP COLUMN "percentage";

-- Convert BookClubBook.status from String to Enum
ALTER TABLE "BookClubBook"
  ALTER COLUMN "status" TYPE "BookClubBookStatus" USING "status"::"BookClubBookStatus";

-- Convert UserBook.status from String to Enum
ALTER TABLE "UserBook"
  ALTER COLUMN "status" TYPE "UserBookStatus" USING "status"::"UserBookStatus";

-- Convert BookSuggestion.status from String to Enum
-- Must drop and re-add default because postgres can't auto-cast string default to enum
ALTER TABLE "BookSuggestion" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "BookSuggestion"
  ALTER COLUMN "status" TYPE "SuggestionStatus" USING "status"::"SuggestionStatus";
ALTER TABLE "BookSuggestion" ALTER COLUMN "status" SET DEFAULT 'pending'::"SuggestionStatus";

-- Convert BookSuggestionVote.voteType from String to Enum
ALTER TABLE "BookSuggestionVote"
  ALTER COLUMN "voteType" TYPE "VoteType" USING "voteType"::"VoteType";
