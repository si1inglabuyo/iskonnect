const express = require('express');
const multer = require('multer');
const ImageKit = require('imagekit');

const router = express.Router();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const upload = multer({ storage: multer.memoryStorage() });

// Authentication endpoint for imagekit-javascript
router.get('/auth', (req, res) => {
  try {
    console.log('/api/upload/auth called from origin:', req.headers.origin || req.headers.referer || 'unknown');
    const result = imagekit.getAuthenticationParameters();
    console.log('Auth params generated:', result);
    res.json(result);
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Failed to generate auth' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      console.warn('Upload endpoint: no file found on request. Headers:', req.headers);
      return res.status(400).json({ error: 'No image' });
    }

    console.log(`Upload endpoint: received file '${req.file.originalname}', size=${req.file.size}`);

    const result = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: req.file.originalname
    });

    res.json({ url: result.url });
  } catch (err) {
    console.error('Upload error:', err.response || err.message || err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;