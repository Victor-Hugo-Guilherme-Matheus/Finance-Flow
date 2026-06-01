import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

const MAX_SIZE_KB = 800;

function compressImage(file: File, maxSizeKB: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Redimensiona se muito grande
        const maxDim = 400;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height / width) * maxDim;
            width = maxDim;
          } else {
            width = (width / height) * maxDim;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        // Comprime até caber no limite
        let quality = 0.9;
        let result = canvas.toDataURL("image/jpeg", quality);
        while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(result);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  const base64 = await compressImage(file, MAX_SIZE_KB);
  await updateDoc(doc(db, "users", userId), { photoURL: base64 });
  return base64;
}