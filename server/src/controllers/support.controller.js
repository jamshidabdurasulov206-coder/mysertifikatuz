const pool = require("../config/db");

// Public API for sending support messages
exports.sendMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Barcha maydonlarni to'ldiring!" });
    }
    
    await pool.query(
      "INSERT INTO support_messages (name, email, message) VALUES ($1, $2, $3)",
      [name, email, message]
    );

    res.status(201).json({ success: true, message: "Murojaatingiz qabul qilindi. Tez orada javob beramiz!" });
  } catch (err) {
    res.status(500).json({ message: "Xatolik yuz berdi: " + err.message });
  }
};

// Admin API to fetch messages
exports.getMessages = async (req, res) => {
  try {
    const messagesRes = await pool.query("SELECT * FROM support_messages ORDER BY created_at DESC");
    res.json({ success: true, data: messagesRes.rows });
  } catch (err) {
    res.status(500).json({ message: "Xatolik: " + err.message });
  }
};

// Admin API to mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE support_messages SET is_read = true WHERE id = $1", [id]);
    res.json({ success: true, message: "O'qilgan deb belgilandi" });
  } catch (err) {
    res.status(500).json({ message: "Xatolik: " + err.message });
  }
};
