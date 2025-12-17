import Message from '../models/Message.js';

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

export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.body;
    await Message.findByIdAndUpdate(messageId, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
