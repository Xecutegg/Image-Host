const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// CORS disabled (no restrictions)
app.use(cors());

// Serve public and uploaded files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Multer setup
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Parse JSON
app.use(express.json());

// Upload from form
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Upload from URL
app.post('/upload-url', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'URL required' });

    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');

    const ext = path.extname(imageUrl).split('?')[0] || '.jpg';
    const filename = `${Date.now()}${ext}`;
    const filePath = path.join(__dirname, 'uploads', filename);
    const fileStream = fs.createWriteStream(filePath);

    response.body.pipe(fileStream);
    response.body.on('error', err => res.status(500).send('Stream error'));

    fileStream.on('finish', () => {
      const finalUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
      res.json({ imageUrl: finalUrl });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
