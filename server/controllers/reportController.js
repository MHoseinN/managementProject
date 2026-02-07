import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Project from '../models/Project.js';
import Report from '../models/Report.js';

// Configure multer storage
const uploadDir = path.resolve('./uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

export const uploader = multer({ storage });

export const submitReport = async (req, res) => {
  try {
    const { projectId, description, title } = req.body;
    const studentId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (String(project.studentId) !== String(studentId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Only allow submissions once the topic has been approved or later
    const allowedStatuses = ['topic_approved', 'scheduled', 'defended', 'graded'];
    if (!allowedStatuses.includes(project.status)) {
      return res.status(400).json({ error: 'Report submission allowed after topic approval' });
    }

    const filePath = req.file ? `/uploads/${req.file.filename}` : undefined;
    const report = await Report.create({
      projectId, studentId, advisorId: project.advisorId, title, description, filePath
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listProjectReports = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).select('studentId advisorId examinerId managerId');
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const userId = String(req.user.id);
    const allowed = [project.studentId, project.advisorId, project.examinerId, project.managerId]
      .filter(Boolean)
      .map(id => String(id))
      .includes(userId);

    if (!allowed) return res.status(403).json({ error: 'Not authorized to view reports' });

    const reports = await Report.find({ projectId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
