-- AddForeignKey
ALTER TABLE "bookclub_invites" ADD CONSTRAINT "bookclub_invites_bookClubId_fkey" FOREIGN KEY ("bookClubId") REFERENCES "bookclubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
