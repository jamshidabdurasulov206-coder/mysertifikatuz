module.exports = function (req, res, next) {
  // Debug uchun log
  console.log("Token ichidagi req.user:", req.user);
  if (req.user && String(req.user.role).toLowerCase() === 'admin') {
    return next();
  }
  return res.status(403).json({ message: "Admin rights required" });
};