import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

// Serve static files from the dist directory
app.use(express.static(distDir));

// Handle all routes for SPA
app.use((req, res, next) => {
  // Skip API routes or static files
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return next();
  }
  
  // For all other routes, serve the index.html
  res.sendFile(path.join(distDir, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving files from: ${distDir}`);
});