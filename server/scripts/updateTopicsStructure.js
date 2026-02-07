import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';

dotenv.config();

const updateTopicsStructure = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/managementProject');
    console.log('✓ Connected to MongoDB');

    // Find all projects with proposedTopics as strings
    const projects = await Project.find({
      proposedTopics: { $exists: true, $ne: [] }
    });

    console.log(`Found ${projects.length} projects to update`);

    for (const project of projects) {
      // Check if proposedTopics are strings (old format)
      if (project.proposedTopics.length > 0 && typeof project.proposedTopics[0] === 'string') {
        const updatedTopics = project.proposedTopics.map((topic, index) => ({
          name: topic,
          description: `موضوع ${index + 1}`
        }));

        await Project.findByIdAndUpdate(
          project._id,
          { proposedTopics: updatedTopics },
          { new: true }
        );

        console.log(`✓ Updated project ${project._id}`);
      }
    }

    console.log('\n✓✓✓ All projects updated successfully! ✓✓✓\n');
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

updateTopicsStructure();
