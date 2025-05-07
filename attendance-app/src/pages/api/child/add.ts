import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { prisma } from "../../../../lib/prisma";
import { resizeAndSave } from "../../../../lib/resizeImage";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "폼 데이터를 파싱하는 중 오류가 발생했습니다." });
    }

    // 필드 추출 및 타입 안전성 처리
    const name = Array.isArray(fields.name)
      ? fields.name[0]
      : fields.name || "";
    const birthDay = Array.isArray(fields.birthDay)
      ? fields.birthDay[0]
      : fields.birthDay || "";
    const gender = Array.isArray(fields.gender)
      ? fields.gender[0]
      : fields.gender || "";
    const managerId = Array.isArray(fields.managerId)
      ? fields.managerId[0]
      : fields.managerId || "";
    const phone = Array.isArray(fields.phone)
      ? fields.phone[0]
      : fields.phone || null;
    const lineId = Array.isArray(fields.lineId)
      ? fields.lineId[0]
      : fields.lineId || null;
    const cacaoTalkId = Array.isArray(fields.cacaoTalkId)
      ? fields.cacaoTalkId[0]
      : fields.cacaoTalkId || null;

    // 필수 필드 검증
    if (!name || !birthDay || !gender || !managerId) {
      return res
        .status(400)
        .json({ message: "모든 필수 필드를 입력해야 합니다." });
    }

    // birthDay 형식 검증
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDay)) {
      return res
        .status(400)
        .json({ message: "생년월일은 YYYY-MM-DD 형식이어야 합니다." });
    }

    // gender 검증
    const validGenders = ["male", "female"];
    if (!validGenders.includes(gender)) {
      return res.status(400).json({
        message: "유효하지 않은 성별입니다. male 또는 female을 입력하세요.",
      });
    }

    // managerId 존재 여부 확인
    const managerExists = await prisma.user.findUnique({
      where: { id: managerId },
    });
    if (!managerExists) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 관리자 ID입니다." });
    }

    // 파일 처리
    let photoPath = "";
    const file = Array.isArray(files.photo) ? files.photo[0] : files.photo;
    if (file && file.filepath) {
      try {
        const buffer = await sharp(file.filepath)
          .rotate() // EXIF Orientation에 따라 자동 회전
          .withMetadata({ orientation: undefined }) // EXIF Orientation 정보 제거
          .toBuffer(); // sharp로 직접 버퍼 생성
        const filename = `${Date.now()}-${
          file.originalFilename || "image.jpg"
        }`;
        photoPath = await resizeAndSave(buffer, filename);
      } catch (error) {
        console.error("이미지 처리 오류:", error);
        return res
          .status(500)
          .json({ message: "이미지 처리 중 오류가 발생했습니다." });
      }
    }

    try {
      const child = await prisma.child.create({
        data: {
          name,
          birthDay: new Date(birthDay),
          gender: gender as "male" | "female",
          photoPath,
          phone,
          lineId,
          cacaoTalkId,
          managerId,
        },
      });

      return res.status(200).json({ message: "Child 등록 성공", child });
    } catch (error) {
      console.error("Prisma 오류:", error);
      return res
        .status(500)
        .json({ message: "Child 등록 중 오류가 발생했습니다." });
    }
  });
}
