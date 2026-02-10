import Project from '../models/Project.js';
import User from '../models/User.js';
import DefenseSlot from '../models/DefenseSlot.js';

/**
 * تعیین داور متوازن بر اساس بار کاری
 * @param {Object} params - { major, term, advisorId }
 * @returns {String|null} - شناسه داور انتخاب شده
 */
export const assignBalancedExaminer = async ({ major, term, advisorId }) => {
  const teachers = await User.find({ role: 'teacher', major }).lean();
  const candidates = teachers.filter(t => String(t._id) !== String(advisorId));
  if (!candidates.length) return null;

  const candidateIds = candidates.map(t => String(t._id));
  const counts = candidateIds.reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {});

  const existing = await Project.find({ term, examinerId: { $ne: null } }).select('examinerId').lean();
  for (const p of existing) {
    const key = String(p.examinerId);
    if (counts[key] !== undefined) counts[key] += 1;
  }

  const sorted = candidateIds.slice().sort((a, b) => {
    if (counts[a] !== counts[b]) return counts[a] - counts[b];
    return a.localeCompare(b);
  });

  return sorted[0] || null;
};

/**
 * یافتن اسلات خالی برای یک داور و ترم
 * @param {Object} params - { examinerId, term }
 * @returns {Object|null} - { slotId, date, time } یا null
 */
export const findAvailableSlotForExaminer = async ({ examinerId, term }) => {
  const slots = await DefenseSlot.find({ examinerId, term });
  for (const s of slots) {
    for (const pd of s.proposedDates || []) {
      for (const t of (pd.timeSlots || [])) {
        const taken = (s.approvedSlots || []).some(as => {
          if (!as.date || !pd.date) return false;
          const sameDay = new Date(as.date).toISOString().slice(0, 10) === new Date(pd.date).toISOString().slice(0, 10);
          return sameDay && as.time === t;
        });
        if (!taken) {
          return { slotId: s._id, date: pd.date, time: t };
        }
      }
    }
  }
  return null;
};

/**
 * زمان‌بندی خودکار پروژه در صورت امکان
 * @param {Object} params - { project }
 * @returns {Object} - پروژه به‌روزرسانی شده
 */
export const scheduleProjectIfPossible = async ({ project }) => {
  if (!project || project.defenseDate || project.status !== 'topic_approved') return project;
  if (!project.examinerId) return project;

  const chosen = await findAvailableSlotForExaminer({ examinerId: project.examinerId, term: project.term });
  if (!chosen) return project;

  project.defenseDate = chosen.date;
  project.defenseTime = chosen.time;
  project.status = 'scheduled';
  await project.save();

  await DefenseSlot.findByIdAndUpdate(chosen.slotId, {
    $push: {
      approvedSlots: {
        date: chosen.date,
        time: chosen.time,
        studentId: project.studentId?._id || project.studentId
      }
    }
  });

  return project;
};

/**
 * تعیین راهنما و داور به صورت متوازن
 * @param {Object} params - { major, term }
 * @returns {Object} - { advisorId, examinerId }
 */
export const assignBalancedTeachers = async ({ major, term }) => {
  const teachers = await User.find({ role: 'teacher', major }).lean();
  if (!teachers.length || teachers.length < 2) {
    throw new Error('Not enough teachers available for assignment');
  }

  const teacherIds = teachers.map(t => String(t._id));
  const counts = teacherIds.reduce((acc, id) => {
    acc[id] = { advisor: 0, examiner: 0 };
    return acc;
  }, {});

  const existing = await Project.find({ term, advisorId: { $ne: null } }).select('advisorId examinerId').lean();
  for (const p of existing) {
    if (p.advisorId && counts[String(p.advisorId)]) counts[String(p.advisorId)].advisor += 1;
    if (p.examinerId && counts[String(p.examinerId)]) counts[String(p.examinerId)].examiner += 1;
  }

  const sortedByAdvisor = teacherIds.slice().sort((a, b) => {
    if (counts[a].advisor !== counts[b].advisor) return counts[a].advisor- counts[b].advisor;
    if (counts[a].examiner !== counts[b].examiner) return counts[a].examiner - counts[b].examiner;
    return a.localeCompare(b);
  });

  const advisorId = sortedByAdvisor[0];

  const sortedByExaminer = teacherIds.filter(id => id !== advisorId).sort((a, b) => {
    if (counts[a].examiner !== counts[b].examiner) return counts[a].examiner - counts[b].examiner;
    if (counts[a].advisor !== counts[b].advisor) return counts[a].advisor - counts[b].advisor;
    return a.localeCompare(b);
  });

  const examinerId = sortedByExaminer[0];

  return { advisorId, examinerId };
};
