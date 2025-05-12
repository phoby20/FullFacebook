import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, Files, Fields } from "formidable";
import { prisma } from "../../../../lib/prisma";
import sharp from "sharp";
import { resizeAndSave } from "../../../../lib/resizeImage";

export const config = {
  api: {
    bodyParser: false, // Next.js 기본 bodyParser 비활성화
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: id as string },
      });
      if (!user) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }
      return res.status(200).json(user);
    } catch (error) {
      console.error("GET error:", error);
      return res.status(500).json({ message: "サーバーエラーが発生しました" });
    }
  }

  if (req.method === "PUT") {
    const form = new IncomingForm({
      uploadDir: "./public/uploads",
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB 제한
      filter: ({ mimetype }) => !!mimetype && mimetype.startsWith("image/"),
    });

    try {
      // FormData 파싱
      const { fields, files }: { fields: Fields; files: Files } =
        await new Promise((resolve, reject) => {
          form.parse(req, (err, fields, files) => {
            if (err) {
              console.error("Formidable parse error:", err);
              reject(err);
            }
            resolve({ fields, files });
          });
        });

      // data 필드 파싱
      const dataString = Array.isArray(fields.data)
        ? fields.data[0]
        : fields.data;
      if (!dataString) {
        return res.status(400).json({ message: "データが提供されていません" });
      }

      const data = JSON.parse(dataString);
      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      // 사진 처리
      let photoPath = data.photoPath || "";
      if (file && file.filepath) {
        try {
          const buffer = await sharp(file.filepath)
            .rotate()
            .withMetadata({ orientation: undefined })
            .toBuffer();
          const filename = `${Date.now()}-${
            file.originalFilename || "image.jpg"
          }`;
          photoPath = await resizeAndSave(buffer, filename);
        } catch (error) {
          console.error("이미지 처리 오류:", error);
          return res
            .status(500)
            .json({ message: "이미지 처리 중 오류가 발생했습니다" });
        }
      }

      // 사용자 업데이트
      const updated = await prisma.user.update({
        where: { id: id as string },
        data: {
          name: data.name,
          email: data.email,
          birthDay: new Date(data.birthDay),
          gender: data.gender,
          role: data.role,
          photoPath,
          phone: data.phone || null,
          lineId: data.lineId || null,
          cacaoTalkId: data.cacaoTalkId || null,
        },
      });

      return res
        .status(200)
        .json({ message: "ユーザー情報が更新されました", user: updated });
    } catch (error) {
      console.error("PUT error:", error);
      return res
        .status(500)
        .json({ message: "ユーザー情報の更新に失敗しました" });
    }
  }

  return res.status(405).json({ message: "許可されていないメソッドです" });
}
