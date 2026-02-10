import Message from '../models/Message.js';
import Project from '../models/Project.js';

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, projectId, content } = req.body;
    const message = new Message({
      senderId: req.user.id,
      receiverId,
      projectId,
      content
    });
    await message.save();
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ receiverId: req.user.id }, { senderId: req.user.id }]
    })
      .populate('senderId receiverId', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProjectMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId)
      .select('studentId advisorId examinerId managerId');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const allowedIds = [
      project.studentId,
      project.advisorId,
      project.examinerId,
      project.managerId
    ]
      .map((id) => id?.toString())
      .filter(Boolean);

    if (!allowedIds.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({
      projectId,
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }]
    })
      .populate('senderId receiverId', 'firstName lastName role')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.body;
    await Message.findByIdAndUpdate(messageId, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
