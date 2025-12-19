import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';
import DefenseSlot from '../models/DefenseSlot.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/managementProject';

async function rescheduleDefenses() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all projects with defense scheduled
    const projects = await Project.find({
      status: 'defense_scheduled',
      defenseDate: { $exists: true }
    });

    console.log(`Found ${projects.length} projects to reschedule`);

    // Time slots (30-minute slots)
    const slots = [
      { hours: 8, minutes: 0 },
      { hours: 8, minutes: 30 },
      { hours: 9, minutes: 0 },
      { hours: 9, minutes: 30 },
      { hours: 10, minutes: 0 },
      { hours: 10, minutes: 30 },
      { hours: 11, minutes: 0 },
      { hours: 11, minutes: 30 },
      { hours: 13, minutes: 0 },
      { hours: 13, minutes: 30 },
      { hours: 14, minutes: 0 },
      { hours: 14, minutes: 30 },
      { hours: 15, minutes: 0 },
      { hours: 15, minutes: 30 },
      { hours: 16, minutes: 0 },
      { hours: 16, minutes: 30 },
    ];

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    for (const project of projects) {
      // Find next available slot for examiner
      let found = false;

      for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
        if (found) break;

        const checkDate = new Date(startDate);
        checkDate.setDate(checkDate.getDate() + dayOffset);

        // Skip Thu/Fri (4, 5)
        if (checkDate.getDay() === 4 || checkDate.getDay() === 5) continue;

        for (const slot of slots) {
          const slotStart = new Date(checkDate);
          slotStart.setHours(slot.hours, slot.minutes, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + 30);

          // Check for conflicts
          const conflict = await DefenseSlot.findOne({
            examinerId: project.examinerId,
            startTime: { $lt: slotEnd },
            endTime: { $gt: slotStart },
          });

          if (!conflict) {
            // Update or create defense slot
            await DefenseSlot.findOneAndUpdate(
              { projectId: project._id },
              {
                projectId: project._id,
                examinerId: project.examinerId,
                advisorId: project.advisorId,
                startTime: slotStart,
                endTime: slotEnd,
              },
              { upsert: true }
            );

            // Update project
            project.defenseDate = slotStart;
            await project.save();

            console.log(
              `✓ Rescheduled ${project.studentId || 'Unknown'}: ${slotStart.toLocaleString()}`
            );

            found = true;
            break;
          }
        }
      }

      if (!found) {
        console.warn(`✗ Could not find slot for project ${project._id}`);
      }
    }

    console.log('Rescheduling completed!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

rescheduleDefenses();
