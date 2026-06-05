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
  folder: string = "pokeus"
): Promise<UploadResult> {
  // If file is a base64 data URI or a URL string, use upload() directly.
  // Cloudinary's upload() natively handles data URIs (data:image/...) and URLs.
  if (typeof file === "string") {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        file,
        {
          folder,
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result!.secure_url,
              publicId: result!.public_id,
              width: result!.width,
              height: result!.height,
            });
          }
        }
      );
    });
  }

  // If file is a raw Buffer, use upload_stream
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result!.secure_url,
            publicId: result!.public_id,
            width: result!.width,
            height: result!.height,
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
