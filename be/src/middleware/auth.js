import supabase from '../config/supabase.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Token tidak ditemukan'
      });
    }

    const token = authHeader.split(' ')[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Token tidak valid'
      });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada autentikasi'
    });
  }
};

export default authMiddleware;