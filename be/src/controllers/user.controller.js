import supabase from "../config/supabase.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { email, password, nama, alamat, no_hp } = req.body;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError)
      return res
        .status(400)
        .json({ success: false, message: authError.message });

    const { error: dbError } = await supabase.from("users").upsert(
      {
        id: authData.user.id,
        nama: nama,
        email: email,
        alamat: alamat,
        no_hp: no_hp,
        saldo: 0,
      },
      { onConflict: "id" }
    ); // Menangani konflik ID secara otomatis

    if (dbError) throw dbError;

    res.status(201).json({ success: true, message: "Registrasi berhasil!" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error)
      return res.status(401).json({ success: false, message: error.message });

    const token = data.session.access_token;

    res.json({
      success: true,
      message: "Login Berhasil",
      token: token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJenisSampah = async (req, res) => {
  const { data, error } = await supabase
    .from("jenis_sampah")
    .select("*")
    .order("kategori");

  if (error) {
    return res.json({ success: false, message: error.message });
  }

  const formatted = data.map((s) => ({
    ...s,
    harga_formatted: `Rp ${s.harga_per_kg.toLocaleString("id-ID")}`,
  }));

  res.json({ success: true, data: formatted });
};

export const dashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("nama, saldo")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    const { data: history, error: historyError } = await supabase
      .from("transaksi")
      .select("*")
      .eq("user_id", userId)
      .order("tanggal", { ascending: false });

    if (historyError) throw historyError;

    const responseData = {
      success: true,
      user: {
        ...user,
        saldo_formatted: `Rp ${user.saldo.toLocaleString("id-ID")}`,
      },
      history: history || [],
    };

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const tambahTransaksi = async (req, res) => {
  try {
    const { jenis_sampah_id, berat } = req.body;
    const userId = req.user.id; // Diambil dari middleware auth token

    // 1. Ambil harga per kg dari tabel jenis_sampah
    const { data: sampah, error: sError } = await supabase
      .from("jenis_sampah")
      .select("harga_per_kg")
      .eq("id", jenis_sampah_id)
      .single();

    if (sError || !sampah)
      return res
        .status(404)
        .json({ success: false, message: "Jenis sampah tidak ditemukan" });

    // 2. Hitung total harga
    const total_harga = parseFloat(berat) * sampah.harga_per_kg;

    // 3. Masukkan ke tabel transaksi
    const { error: trxError } = await supabase.from("transaksi").insert([
      {
        user_id: userId,
        jenis_sampah_id,
        berat: parseFloat(berat),
        total_harga,
        status: "Selesai",
      },
    ]);

    if (trxError) throw trxError;

    // 4. Update Saldo User
    const { data: userData } = await supabase
      .from("users")
      .select("saldo")
      .eq("id", userId)
      .single();
    const saldoBaru = (parseFloat(userData.saldo) || 0) + total_harga;

    await supabase.from("users").update({ saldo: saldoBaru }).eq("id", userId);

    res
      .status(201)
      .json({
        success: true,
        message: "Setoran berhasil! Saldo Anda bertambah.",
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const tarikSaldo = async (req, res) => {
  try {
    const { jumlah, metode } = req.body;
    const userId = req.user.id;

    // 1. Ambil saldo user saat ini
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("saldo")
      .eq("id", userId)
      .single();

    // PERBAIKAN: Gunakan fetchError (sesuai variabel di atas) bukan userError
    if (fetchError || !user) {
        return res.status(404).json({ success: false, message: "Data user tidak ditemukan" });
    }

    // 2. Validasi saldo mencukupi
    if (user.saldo < jumlah) {
      return res.status(400).json({ success: false, message: "Saldo tidak mencukupi" });
    }

    const saldoBaru = user.saldo - jumlah;

    // 3. Update saldo di tabel users
    const { error: updateError } = await supabase
      .from("users")
      .update({ saldo: saldoBaru })
      .eq("id", userId);

    if (updateError) throw updateError;

    // 4. LOG riwayat ke tabel penarikan
    await supabase.from("penarikan").insert([
      { 
        user_id: userId, 
        jumlah: jumlah, 
        metode: metode, 
        status: 'Selesai',
        tanggal: new Date() 
      }
    ]);

    res.json({
      success: true,
      message: "Penarikan berhasil!",
      data: {
        saldo_baru: saldoBaru,
        saldo_baru_formatted: `Rp ${saldoBaru.toLocaleString("id-ID")}`,
      },
    });
  } catch (error) {
    // Menangkap error 500 dan memberikan pesan yang jelas
    res.status(500).json({ success: false, message: error.message });
  }
};
