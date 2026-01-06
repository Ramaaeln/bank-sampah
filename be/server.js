import 'dotenv/config';
import app from './src/app.js';

// HANYA jalankan listen jika kita berada di lingkungan lokal (bukan production/Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// EKSPOR default sangat penting agar Vercel bisa mengenali aplikasi Express Anda
export default app;