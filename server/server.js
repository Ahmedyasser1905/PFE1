import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});

// Keep the process alive (Express 5 + Node 24 compat)
setInterval(() => {}, 1 << 30);
