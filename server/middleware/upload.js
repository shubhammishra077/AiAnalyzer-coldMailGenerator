const multer = require('multer');

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = /\.(pdf|docx|txt)$/i;

const uploader = multer({
  storage: multer.memoryStorage(), // never written to disk
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_EXT.test(file.originalname || '')) {
      return cb(Object.assign(new Error('Only PDF, DOCX or TXT files are allowed.'), { code: 'BAD_FILE_TYPE' }));
    }
    cb(null, true);
  },
});

// Wraps multer so its errors become clean JSON responses
const uploadResume = (req, res, next) => {
  uploader.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'File is too large (max 5 MB).' });
    if (err.code === 'BAD_FILE_TYPE') return res.status(400).json({ message: err.message });
    console.error('Upload error:', err.message);
    return res.status(400).json({ message: 'Could not process the upload.' });
  });
};

module.exports = { uploadResume, MAX_BYTES };
