import mongoose from 'mongoose';
import Project from '../models/Project.js';

mongoose.connect('mongodb://127.0.0.1:27017/managementProject')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const projectId = '694581f7e7c43fa046735b60';
    
    const project = await Project.findById(projectId);
    
    if (project) {
      project.proposedTopics = [
        'سیستم مدیریت هوشمند پارکینگ با استفاده از IoT و یادگیری ماشین',
        'پلتفرم آنلاین آموزش زبان با قابلیت تشخیص صدا و تصحیح تلفظ',
        'اپلیکیشن موبایل برای مدیریت سلامت و تناسب اندام با استفاده از AI'
      ];
      
      await project.save();
      
      console.log('\n✓ Proposed topics added successfully!');
      console.log('\nProject ID:', project._id);
      console.log('Topics:');
      project.proposedTopics.forEach((topic, i) => {
        console.log(`  ${i + 1}. ${topic}`);
      });
    } else {
      console.log('Project not found');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
