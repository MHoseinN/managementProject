import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Capacity from '../models/Capacity.js';
import Project from '../models/Project.js';
import DefenseSlot from '../models/DefenseSlot.js';
import Message from '../models/Message.js';

dotenv.config();

const resetDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/managementProject');
    console.log('✓ Connected to MongoDB');

    console.log('\n⚠️  WARNING: This will delete ALL data from the database!');
    console.log('   Including all users, projects, defense slots, and messages.\n');

    // Ask for confirmation
    const args = process.argv.slice(2);
    if (!args.includes('--confirm')) {
      console.log('To proceed with reset, run:\n');
      console.log('   node scripts/resetDatabase.js --confirm\n');
      await mongoose.connection.close();
      return;
    }

    // Clear all data
    await User.deleteMany({});
    console.log('✓ Deleted all users');
    
    await Capacity.deleteMany({});
    console.log('✓ Deleted all capacities');
    
    await Project.deleteMany({});
    console.log('✓ Deleted all projects');
    
    await DefenseSlot.deleteMany({});
    console.log('✓ Deleted all defense slots');
    
    await Message.deleteMany({});
    console.log('✓ Deleted all messages');

    console.log('\n✓✓✓ Database reset successfully! ✓✓✓');
    console.log('\n💡 To seed initial data, run: node seed.js\n');

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

resetDatabase();
