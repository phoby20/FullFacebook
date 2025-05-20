import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getTokenUser } from "../../../../utils/auth";

const prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getTokenUser(req);
  console.log("User:", user);
  if (!user || user.role === "child") {
    res.status(403).json({ message: "権限がありません。" });
  }

  if (req.method === "GET") {
    try {
      console.log("Fetching duties...");
      const duties = await prisma.duty.findMany({
        orderBy: { createdAt: "asc" },
      });
      console.log("Duties:", duties);
      res.status(200).json(duties);
    } catch (error) {
      console.error("Error fetching duties:", error);
      res.status(500).json({
        message: `当番の取得に失敗しました。${error}`,
      });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === "POST") {
    const { name } = req.body;
    console.log("Received duty name:", name);

    if (!name) {
      res.status(400).json({ message: "当番名が必要です。" });
    }

    try {
      const duty = await prisma.duty.create({
        data: { name },
      });
      console.log("Created duty:", duty);
      res.status(201).json(duty);
    } catch (error) {
      console.error("Error creating duty:", error);
      res.status(500).json({
        message: `当番の追加に失敗しました。${error}`,
      });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.status(405).json({ message: "メソッドが許可されていません。" });
  }
}
