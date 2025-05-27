// pages/api/duty-assignments/assign.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, Prisma } from "@prisma/client";
import { getTokenUser } from "../../../../utils/auth";

const prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getTokenUser(req);
  if (!user || user.role === "child") {
    return res.status(403).json({ message: "権限がありません。" });
  }

  if (req.method === "GET") {
    try {
      console.log("Fetching duty assignments...");
      // 현재 날짜에서 1주 전 날짜 계산
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
      const assignments = await prisma.dutyAssignment.findMany({
        where: {
          date: {
            gte: twoWeeksAgo, // 2주 전 이후 데이터만 조회
          },
        },
        include: {
          duty: true,
          child: { select: { id: true, name: true, birthDay: true } },
        },
        orderBy: { date: "desc" },
      });
      console.log("Assignments:", assignments);
      return res.status(200).json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      return res.status(500).json({
        message: `当番指定の取得に失敗しました。${error}`,
      });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === "POST") {
    const assignments = req.body;
    console.log("Received assignments:", assignments);

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        message: "有効な当番指定が必要です。",
      });
    }
    console.log("user:", user);

    try {
      // 중복 체크
      for (const assignment of assignments) {
        const { dutyId, childId, date } = assignment;

        // 1. 동일한 학생이 동일한 날짜에 동일한 당번으로 지정되었는지 확인
        const existingSameChildAssignment =
          await prisma.dutyAssignment.findFirst({
            where: {
              dutyId,
              childId,
              date: new Date(date),
            },
          });

        if (existingSameChildAssignment) {
          return res.status(400).json({
            message: "同じ学生が同じ日付でこの当番に既に指定されています。",
          });
        }

        // 2. 동일한 날짜에 동일한 당번이 다른 학생에게 지정되었는지 확인
        const existingSameDutyAssignment =
          await prisma.dutyAssignment.findFirst({
            where: {
              dutyId,
              date: new Date(date),
            },
          });

        if (existingSameDutyAssignment) {
          return res.status(400).json({
            message: "この当番は同じ日付で他の学生に既に指定されています。",
          });
        }
      }

      // 중복이 없으면 트랜잭션으로 생성
      const createdAssignments = await prisma.$transaction(
        assignments.map(
          (assignment: { dutyId: string; childId: string; date: string }) =>
            prisma.dutyAssignment.create({
              data: {
                dutyId: assignment.dutyId,
                childId: assignment.childId,
                date: new Date(assignment.date),
                assignedById: user.userId, // 로그인 유저의 ID
              } as Prisma.DutyAssignmentUncheckedCreateInput,
              include: {
                duty: true,
                child: { select: { id: true, name: true } },
                assignedBy: { select: { id: true, name: true } },
              },
            })
        )
      );
      console.log("Created assignments:", createdAssignments);
      return res.status(201).json(createdAssignments);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return res.status(400).json({
          message: "データベースの制約により当番指定に失敗しました。",
        });
      }
      console.error("Error creating assignments:", error);
      return res.status(500).json({
        message: `当番の指定に失敗しました。${error}`,
      });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    return res.status(405).json({ message: "メソッドが許可されていません。" });
  }
}
