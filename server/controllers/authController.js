import User from '../models/User.js';
import Project from '../models/Project.js';
import Capacity from '../models/Capacity.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.nationalId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const register = async (req, res) => {
  try {
    const { firstName, lastName, nationalId, identityNumber, major, role } = req.body;
    
    const existing = await User.findOne({ nationalId });
    if (existing) return res.status(400).json({ error: 'User exists' });
    
    const hashedPassword = await bcrypt.hash(identityNumber, 10);
    const user = new User({
      firstName,
      lastName,
      nationalId,
      password: hashedPassword,
      major,
      role,
      isApproved: role === 'admin' ? true : false,
      studentId: role === 'student' ? identityNumber : undefined,
      teacherId: ['teacher', 'manager'].includes(role) ? identityNumber : undefined
    });
    
    await user.save();
    res.json({ message: 'Registration successful, pending admin approval' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { nationalId, identityNumber, role } = req.body;
    
    const user = await User.findOne({ nationalId, role });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (!user.isApproved && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not approved yet' });
    }
    
    const isValid = await bcrypt.compare(identityNumber, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = generateToken(user);
    res.json({ token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const adminApprove = async (req, res) => {
  try {
    const { userId, approved } = req.body;
    const user = await User.findByIdAndUpdate(userId, { isApproved: approved }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ isApproved: false });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
