const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload an in-memory buffer, returns { url, publicId }
const uploadBuffer = (buffer, folder = 'findit') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto' }],
      },
      (err, result) =>
        err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id })
    );
    stream.end(buffer);
  });

// Delete images by publicId (never throws)
const deleteImages = async (publicIds = []) => {
  await Promise.all(publicIds.map((id) => cloudinary.uploader.destroy(id).catch(() => null)));
};

module.exports = { cloudinary, uploadBuffer, deleteImages };