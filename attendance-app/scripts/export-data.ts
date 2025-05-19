// scripts/export-data.ts
/**
 * 실행방법
 * 1. 터미널에서 `node scripts/export-data.js` 명령어를 실행합니다.
 * 2. `backup.json` 파일이 생성되고, 데이터가 저장됩니다.
 * 3. `backup.json` 파일을 열어 데이터가 올바르게 저장되었는지 확인합니다.
 * 4. 데이터베이스에 문제가 발생한 경우, `backup.json` 파일을 사용하여 데이터를 복원할 수 있습니다.
 * 5. 복원 방법은 `import-data.ts` 스크립트를 사용하여 데이터를 데이터베이스에 다시 삽입하는 것입니다.
 * 6. `import-data.ts` 스크립트는 `backup.json` 파일을 읽어 데이터베이스에 데이터를 삽입합니다.
 * 7. 복원 후, 데이터베이스의 데이터가 올바르게 복원되었는지 확인합니다.
 * 8. 데이터베이스에 문제가 발생한 경우, `backup.json` 파일을 사용하여 데이터를 복원할 수 있습니다.
 */

// const { PrismaClient } = require("@prisma/client");
// const fs = require("fs/promises");

// const prisma = new PrismaClient();

// async function exportData() {
//   try {
//     const users = await prisma.user.findMany();
//     const children = await prisma.child.findMany();
//     const attendances = await prisma.attendance.findMany();
//     const organizations = await prisma.organization.findMany();
//     const groups = await prisma.group.findMany();
//     const userOrganizations = await prisma.userOrganization.findMany();
//     const userGroups = await prisma.userGroup.findMany();

//     const data = {
//       users,
//       children,
//       attendances,
//       organizations,
//       groups,
//       userOrganizations,
//       userGroups,
//     };

//     await fs.writeFile("backup.json", JSON.stringify(data, null, 2));
//     console.log("데이터가 backup.json으로 내보내졌습니다.");
//   } catch (error) {
//     console.error("데이터 내보내기 실패:", error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// exportData();
