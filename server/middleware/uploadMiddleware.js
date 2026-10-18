const multer = require('multer');

const fileFilter = (req, file, cb) => {
  if (/^image\/(jpe?g|png|webp)$/.test(file.mimetype)) return cb(null, true);
  const err = new Error('Only JPG, PNG or WEBP images are allowed');
  err.statusCode = 400;
  cb(err);
};

module.exports = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 }, // 5 MB each, max 4 files
});