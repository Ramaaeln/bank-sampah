import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';

const app = express();

app.use(cors({
  origin: ['https://bank-sampah-rust.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// 🔥 INI YANG KURANG
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API ONLY
app.use('/api', userRoutes);

// 404 API
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan'
  });
});

export default app;
