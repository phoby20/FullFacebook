import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, Fields, Files } from "formidable";
import { join } from "path";
import sharp from "sharp";

// formidable 기본 설정
export const config = {
  api: {
    bodyParser: false, // Next.js의 기본 bodyParser 비활성화
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const form = new IncomingForm({
      uploadDir: join(process.cwd(), "public/uploads"),
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB 제한
    });

    const files: Files = await new Promise((resolve, reject) => {
      form.parse(req, (err: Error | null, _fields: Fields, files: Files) => {
        if (err) reject(err);
        resolve(files);
      });
    });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!file.mimetype || !allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: "Unsupported file type" });
    }

    const filename = `${Date.now()}-${file.originalFilename || "unknown"}`;
    const filePath = join(process.cwd(), "public/uploads", filename);

    // sharp를 사용하여 이미지를 600x600으로 리사이징
    await sharp(file.filepath)
      .resize({
        width: 600,
        height: 600,
        fit: "cover", // 이미지를 600x600에 맞게 자름
        position: "center", // 중앙을 기준으로 자름
      })
      .toFormat("jpg", { quality: 80 })
      .toFile(filePath);

    return res.status(200).json({ photoPath: `/uploads/${filename}` });
  } catch (error) {
    console.error("Error processing file:", error);
    return res.status(500).json({ message: "Failed to process file" });
  }
}
