import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // master 계정 데이터
  const masterData = {
    name: "Master Admin",
    email: "master@example.com",
    password: await bcrypt.hash("master@123", 10), // 비밀번호 해시
    birthDay: new Date("1980-01-01"),
    gender: "male" as const, // Gender 열거형
    role: "master" as const, // Role 열거형
  };

  // master 계정 추가 (이미 존재하면 업데이트)
  await prisma.user.upsert({
    where: { email: masterData.email },
    update: {}, // 이메일이 이미 존재하면 업데이트하지 않음
    create: {
      ...masterData,
      createdAt: new Date(),
    },
  });

  console.log("Master 계정이 성공적으로 추가되었습니다.");
}

main()
  .catch((e) => {
    console.error("Seed 오류:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
