import { deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { profilePhotoDoc } from "./db";

/**
 * A foto fica em users/{uid}/settings/profilePhoto, separada do perfil,
 * para o documento do usuário continuar legível no console do Firebase.
 * Limite de ~500 KB no texto base64 (o Firestore aceita até 1 MiB por documento).
 */
const MAX_DATA_URL_CHARS = 500_000;
const MAX_DIMENSION = 400;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let result = canvas.toDataURL("image/jpeg", quality);
        while (result.length > MAX_DATA_URL_CHARS && quality > 0.2) {
          quality -= 0.1;
          result = canvas.toDataURL("image/jpeg", quality);
        }
        if (result.length > MAX_DATA_URL_CHARS) reject(new Error("Imagem muito grande"));
        else resolve(result);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  const dataUrl = await compressImage(file);
  await setDoc(profilePhotoDoc(userId), { dataUrl, updatedAt: serverTimestamp() });
  return dataUrl;
}

export async function removeProfilePhoto(userId: string): Promise<void> {
  await deleteDoc(profilePhotoDoc(userId));
}
