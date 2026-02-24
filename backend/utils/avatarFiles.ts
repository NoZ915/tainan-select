import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

const resolveAvatarDir = (): string => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, "..", "public", "avatars");
};

export const isAvatarAvailable = async (avatar: string): Promise<boolean> => {
  const avatarDir = resolveAvatarDir();
  const avatarPath = path.join(avatarDir, avatar);
  try {
    const stat = await fs.stat(avatarPath);
    if (!stat.isFile()) {
      return false;
    }
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return false;
    }
    throw err;
  }
  return IMAGE_EXTENSIONS.has(path.extname(avatar).toLowerCase());
};
