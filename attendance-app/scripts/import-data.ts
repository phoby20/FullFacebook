// scripts/import-data.ts

/**
 * 실행방법
 * 1. 터미널에서 `node scripts/import-data.js` 명령어를 실행합니다.
 * 2. `backup.json` 파일을 읽어 데이터베이스에 데이터를 삽입합니다.
 * 3. 데이터베이스에 문제가 발생한 경우, `backup.json` 파일을 사용하여 데이터를 복원할 수 있습니다.
 * 4. 복원 후, 데이터베이스의 데이터가 올바르게 복원되었는지 확인합니다.
 */

// const { PrismaClient } = require("@prisma/client");
// const fs = require("fs/promises");

// const prisma = new PrismaClient();

// async function importData() {
//   try {
//     const data = JSON.parse(await fs.readFile("backup.json", "utf-8"));
//     await prisma.$transaction([
//       prisma.user.deleteMany(),
//       prisma.child.deleteMany(),
//       prisma.attendance.deleteMany(),
//       prisma.organization.deleteMany(),
//       prisma.group.deleteMany(),
//       prisma.userOrganization.deleteMany(),
//       prisma.userGroup.deleteMany(),
//       prisma.user.createMany({ data: data.users }),
//       prisma.child.createMany({ data: data.children }),
//       prisma.attendance.createMany({ data: data.attendances }),
//       prisma.organization.createMany({ data: data.organizations }),
//       prisma.group.createMany({ data: data.groups }),
//       prisma.userOrganization.createMany({ data: data.userOrganizations }),
//       prisma.userGroup.createMany({ data: data.userGroups }),
//     ]);
//     console.log("데이터가 복원되었습니다.");
//   } catch (error) {
//     console.error("데이터 복원 실패:", error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// importData();
