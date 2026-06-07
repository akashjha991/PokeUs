import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export async function uploadImage(
  file: Buffer | string,
  folder: string = "pokeus",
  resourceType: "image" | "video" | "raw" | "auto" = "auto"
): Promise<UploadResult> {
  const options: any = {
    folder,
    resource_type: resourceType,
  };
  if (resourceType === "image") {
    options.transformation = [{ quality: "auto", fetch_format: "auto" }];
  }

  // If file is a string (base64 data URI or URL), use upload() directly.
  if (typeof file === "string") {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        file,
        options,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result!.secure_url,
              publicId: result!.public_id,
              width: result!.width || 0,
              height: result!.height || 0,
            });
          }
        }
      );
    });
  }

  // If file is a raw Buffer, use upload_stream
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result!.secure_url,
            publicId: result!.public_id,
            width: result!.width || 0,
            height: result!.height || 0,
          });
        }
      }
    );
    stream.end(file);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
