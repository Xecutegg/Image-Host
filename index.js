const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Create uploads directory if it doesn't exist
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

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

// Helper to determine protocol
function getProtocol(host) {
  return host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
}

// Upload from form
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  const protocol = getProtocol(req.get('host'));
  const imageUrl = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Upload from URL
app.post('/upload-url', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'URL required' });

    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    // Get extension from URL or content-type
    let ext = path.extname(imageUrl).split('?')[0];
    if (!ext) {
      const contentType = response.headers['content-type'];
      if (contentType) {
        if (contentType.includes('png')) ext = '.png';
        else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
        else if (contentType.includes('gif')) ext = '.gif';
        else if (contentType.includes('webp')) ext = '.webp';
        else ext = '.jpg';
      } else {
        ext = '.jpg';
      }
    }

    const host = req.get('host');
    const protocol = getProtocol(host);
    const filename = `${Date.now()}${ext}`;
    const filePath = path.join(__dirname, 'uploads', filename);
    const fileStream = fs.createWriteStream(filePath);

    response.data.pipe(fileStream);

    fileStream.on('finish', () => {
      const finalUrl = `${protocol}://${host}/uploads/${filename}`;
      console.log('Image saved:', finalUrl);
      res.json({ imageUrl: finalUrl });
    });

    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).json({ error: 'Failed to save image' });
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Proxy route to fetch images from external URLs
app.get('/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL parameter required');

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    // Set content type from external source
    if (response.headers['content-type']) {
      res.setHeader('content-type', response.headers['content-type']);
    }

    response.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
