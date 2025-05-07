import sharp from "sharp";
import fs from "fs";
import path from "path";

export async function resizeAndSave(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const outputPath = path.join(process.cwd(), "public", "uploads", filename);
  await sharp(buffer).resize(600, 600).toFile(outputPath);
  return `/uploads/${filename}`;
}
export async function resizeImage(
  imagePath: string,
  width: number,
  height: number
): Promise<string> {
  const outputPath = path.join(
    process.cwd(),
    "public",
    "uploads",
    `resized-${width}x${height}-${path.basename(imagePath)}`
  );

  await sharp(imagePath).resize(width, height).toFile(outputPath);
  return outputPath;
}
export async function deleteImage(imagePath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), "public", imagePath);
  try {
    await fs.promises.unlink(fullPath); // Delete the file
  } catch (error) {
    console.error("Error deleting image:", error);
  }
}
export async function deleteResizedImage(imagePath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), "public", imagePath);
  try {
    await fs.promises.unlink(fullPath); // Delete the file
  } catch (error) {
    console.error("Error deleting resized image:", error);
  }
}
export async function deleteAllImages(): Promise<void> {
  const dirPath = path.join(process.cwd(), "public", "uploads");
  try {
    const files = await fs.promises.readdir(dirPath);
    await Promise.all(
      files.map((file) => fs.promises.unlink(path.join(dirPath, file)))
    );
  } catch (error) {
    console.error("Error deleting all images:", error);
  }
}
export async function deleteAllResizedImages(): Promise<void> {
  const dirPath = path.join(process.cwd(), "public", "uploads");
  try {
    const files = await fs.promises.readdir(dirPath);
    await Promise.all(
      files
        .filter((file) => file.startsWith("resized-"))
        .map((file) => fs.promises.unlink(path.join(dirPath, file)))
    );
  } catch (error) {
    console.error("Error deleting all resized images:", error);
  }
}
export async function deleteImageByName(imageName: string): Promise<void> {
  const dirPath = path.join(process.cwd(), "public", "uploads");
  try {
    const fullPath = path.join(dirPath, imageName);
    await fs.promises.unlink(fullPath); // Delete the file
  } catch (error) {
    console.error("Error deleting image:", error);
  }
}
export async function deleteResizedImageByName(
  imageName: string
): Promise<void> {
  const dirPath = path.join(process.cwd(), "public", "uploads");
  try {
    const fullPath = path.join(dirPath, `resized-${imageName}`);
    await fs.promises.unlink(fullPath); // Delete the file
  } catch (error) {
    console.error("Error deleting resized image:", error);
  }
}
export async function deleteAllImagesByName(
  imageNames: string[]
): Promise<void> {
  const dirPath = path.join(process.cwd(), "public", "uploads");
  try {
    await Promise.all(
      imageNames.map((imageName) =>
        fs.promises.unlink(path.join(dirPath, imageName))
      )
    );
  } catch (error) {
    console.error("Error deleting all images:", error);
  }
}
export async function deleteAllResizedImagesByName(
  imageNames: string[]
): Promise<void> {
  const dirPath = path.join(process.cwd(), "public", "uploads");
  try {
    await Promise.all(
      imageNames.map((imageName) =>
        fs.promises.unlink(path.join(dirPath, `resized-${imageName}`))
      )
    );
  } catch (error) {
    console.error("Error deleting all resized images:", error);
  }
}
