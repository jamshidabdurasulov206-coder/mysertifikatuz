const subjectService = require("../services/subject.service");

exports.createSubject = async (req, res) => {
  try {
    const subject = await subjectService.createSubject(req.body);
    res.json(subject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const subjects = await subjectService.getSubjects(page, limit);
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    await subjectService.deleteSubject(req.params.id);
    res.json({ message: "Subject deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};