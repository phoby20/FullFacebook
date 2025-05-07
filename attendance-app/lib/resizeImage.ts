import sharp from "sharp";
import { put, del, list } from "@vercel/blob";
import path from "path";

// 이미지 리사이징 후 Vercel Blob에 업로드
export async function resizeAndSave(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    // sharp로 이미지 리사이징
    const resizedBuffer = await sharp(buffer)
      .resize(600, 600, { fit: "cover" }) // 기존 설정 유지
      .toBuffer();

    // Vercel Blob에 업로드
    const blob = await put(`uploads/${filename}`, resizedBuffer, {
      access: "public",
      contentType: "image/jpeg", // 파일 형식에 따라 동적 설정 가능
    });

    return blob.url;
  } catch (error) {
    console.error("resizeAndSave 오류:", error);
    throw new Error("이미지 리사이징 또는 업로드 실패");
  }
}

// 특정 이미지 삭제
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Vercel Blob에서 파일 삭제
    await del(imageUrl);
  } catch (error) {
    console.error("deleteImage 오류:", error);
    // Blob에서 파일이 없어도 에러 무시 (필요 시 수정)
  }
}

// 모든 이미지 삭제
export async function deleteAllImages(): Promise<void> {
  try {
    // 업로드 디렉토리의 모든 Blob 목록 가져오기
    const { blobs } = await list({ prefix: "uploads/" });
    if (blobs.length === 0) return;

    // 모든 Blob 삭제
    await del(blobs.map((blob) => blob.url));
  } catch (error) {
    console.error("deleteAllImages 오류:", error);
    throw new Error("모든 이미지 삭제 실패");
  }
}

// 특정 이미지 리사이징 (필요 시 사용)
export async function resizeImage(
  imageUrl: string,
  width: number,
  height: number
): Promise<string> {
  try {
    // Blob에서 이미지 다운로드
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("이미지 다운로드 실패");
    const buffer = Buffer.from(await response.arrayBuffer());

    // sharp로 리사이징
    const resizedBuffer = await sharp(buffer)
      .resize(width, height, { fit: "cover" })
      .toBuffer();

    // 새 파일명 생성
    const filename = `resized-${width}x${height}-${path.basename(imageUrl)}`;
    const blob = await put(`uploads/${filename}`, resizedBuffer, {
      access: "public",
      contentType: "image/jpeg",
    });

    return blob.url;
  } catch (error) {
    console.error("resizeImage 오류:", error);
    throw new Error("이미지 리사이징 실패");
  }
}
