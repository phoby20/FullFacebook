-- CreateTable: Child-Admin 다대다 중간 테이블
CREATE TABLE "ChildAdminAssignment" (
    "childId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildAdminAssignment_pkey" PRIMARY KEY ("childId","adminId")
);

-- AddForeignKey
ALTER TABLE "ChildAdminAssignment" ADD CONSTRAINT "ChildAdminAssignment_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildAdminAssignment" ADD CONSTRAINT "ChildAdminAssignment_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 기존 assignedAdminId 데이터를 새 중간 테이블로 이전
INSERT INTO "ChildAdminAssignment" ("childId", "adminId")
SELECT "id", "assignedAdminId"
FROM "Child"
WHERE "assignedAdminId" IS NOT NULL;

-- DropColumn: Child 테이블에서 assignedAdminId 컬럼 제거
ALTER TABLE "Child" DROP COLUMN "assignedAdminId";
