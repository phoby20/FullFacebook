import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, Fields, Files } from "formidable";
import sharp from "sharp";
import { put } from "@vercel/blob";

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
      keepExtensions: true,
      maxFileSize: 1024 * 1024, // 1MB 제한
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

    // sharp로 이미지 리사이징
    const resizedBuffer = await sharp(file.filepath)
      .resize({
        width: 600,
        height: 600,
        fit: "cover", // 이미지를 600x600에 맞게 자름
        position: "center", // 중앙을 기준으로 자름
      })
      .toFormat("jpg", { quality: 80 })
      .toBuffer();

    // Vercel Blob에 업로드
    const filename = `${Date.now()}-${file.originalFilename || "unknown"}`;
    const blob = await put(`uploads/${filename}`, resizedBuffer, {
      access: "public",
      contentType: "image/jpeg",
    });

    return res.status(200).json({ photoPath: blob.url });
  } catch (error) {
    console.error("Error processing file:", error);
    return res.status(500).json({ message: "Failed to process file" });
  }
}
