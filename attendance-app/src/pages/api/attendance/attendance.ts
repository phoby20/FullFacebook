import { NextApiRequest, NextApiResponse } from "next";
import { jwtDecode } from "jwt-decode";
import { prisma } from "../../../../lib/prisma";

type DecodedToken = {
  userId: string;
  role: "superAdmin" | "admin" | "child";
};

interface AttendanceRecord {
  id: string;
  date: Date;
  checkedById?: string;
}

interface ChildWithAttendance {
  id: string;
  name: string;
  photoPath: string;
  attendance: AttendanceRecord[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const { startDate, endDate } = req.query;
  // startDate와 endDate 필수 확인
  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "startDate와 endDate는 필수입니다" });
  }

  // 문자열로 받은 날짜를 Date 객체로 변환
  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  console.log("Received dates:", { start, end });

  // start를 00:00:00.000Z로, end를 23:59:59.999Z로 설정 (UTC 기준)
  const startAdjusted = new Date(
    start.toISOString().split("T")[0] + "T00:00:00.000Z"
  );
  const endAdjusted = new Date(
    end.toISOString().split("T")[0] + "T23:59:59.999Z"
  );

  try {
    const decoded: DecodedToken = jwtDecode(token);
    if (decoded.role === "child") {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    const children: ChildWithAttendance[] = await prisma.child.findMany({
      // where:
      //   decoded.role === "superAdmin"
      //     ? {}
      //     : { assignedAdminId: decoded.userId },
      select: {
        id: true,
        name: true,
        photoPath: true,
        attendance: {
          select: {
            id: true,
            date: true,
            checkedById: true,
          },
          where: {
            date: {
              gte: startAdjusted,
              lte: endAdjusted,
            },
          },
          orderBy: { date: "desc" },
        },
      },
    });

    return res.status(200).json(
      children.map((child: ChildWithAttendance) => ({
        ...child,
        attendance: child.attendance.map((record: AttendanceRecord) => ({
          ...record,
          date: record.date.toISOString(),
        })),
      }))
    );
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return res.status(500).json({ message: "Failed to fetch attendance" });
  }
}
