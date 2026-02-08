import User from '../models/User.js';
import Project from '../models/Project.js';
import Capacity from '../models/Capacity.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (user) => {
  // Embed major so downstream endpoints (capacity, enrollment) know the user's major without extra queries.
  return jwt.sign(
    { id: user._id, role: user.role, email: user.nationalId, major: user.major },
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
    res.json({ message: 'ثبت‌نام انجام شد؛ در انتظار تایید ادمین' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    console.log('[LOGIN] Request received');
    console.log('[LOGIN] req.body:', req.body);
    
    const { nationalId, identityNumber } = req.body;
    console.log('[LOGIN] Destructured:', { nationalId, identityNumber });
    
    if (!nationalId || !identityNumber) {
      console.warn('[LOGIN] Missing required fields:', { nationalId, identityNumber });
      return res.status(400).json({ error: 'nationalId and identityNumber are required' });
    }
    
    console.log('[LOGIN] Searching user:', { nationalId });
    const user = await User.findOne({ nationalId });
    console.log('[LOGIN] User found:', user ? user._id : 'none');
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    console.log('[LOGIN] Checking approval:', { isApproved: user.isApproved, role: user.role });
    if (!user.isApproved && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not approved yet' });
    }
    
    console.log('[LOGIN] Starting password compare...');
    const isValid = await bcrypt.compare(identityNumber, user.password);
    console.log('[LOGIN] Password valid:', isValid);
    
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    
    console.log('[LOGIN] Generating token...');
    const token = generateToken(user);
    console.log('[LOGIN] Token generated');
    
    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        major: user.major,
      }
    });
    console.log('[LOGIN] Success response sent');
  } catch (err) {
    console.error('[LOGIN] ERROR:', err.message);
    console.error('[LOGIN] Stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
};

export const adminApprove = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: userId, isApproved: false },
      { isApproved: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'کاربر یافت نشد یا قبلاً رسیدگی شده است' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const adminReject = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.json({ message: 'کاربر یافت نشد یا قبلاً رسیدگی شده است' });
    }
    if (user.isApproved) {
      return res.json({ message: 'کاربر قبلاً تایید شده است؛ حذف نشد' });
    }
    await User.deleteOne({ _id: userId });
    res.json({ message: 'کاربر رد و حذف شد' });
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

export const getApprovedUsers = async (req, res) => {
  try {
    const users = await User.find({ isApproved: true }).select('firstName lastName nationalId major role');
    const grouped = {
      student: {},
      teacher: {},
      manager: {}
    };

    users.forEach(u => {
      if (!grouped[u.role]) return;
      if (!grouped[u.role][u.major]) grouped[u.role][u.major] = [];
      grouped[u.role][u.major].push(u);
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('firstName lastName nationalId major role isApproved createdAt');
    const stats = {
      total: users.length,
      approved: users.filter(u => u.isApproved).length,
      pending: users.filter(u => !u.isApproved).length
    };
    res.json({ stats, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
