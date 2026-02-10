import DefenseSlot from "../models/DefenseSlot.js";
import Project from "../models/Project.js";
import Capacity from "../models/Capacity.js";

const getRequiredSlotsForTerm = async ({ term, major }) => {
  if (!term || !major) return 0;
  const capacity = await Capacity.findOne({ term, major }).lean();
  if (!capacity || !Array.isArray(capacity.examinerLimits)) return 0;
  return capacity.examinerLimits.reduce(
    (max, l) => Math.max(max, Number(l.limit || 0)),
    0
  );
};

const checkCapacityExists = async ({ term, major }) => {
  if (!term || !major) {
    return false;
  }
  try {
    const capacity = await Capacity.findOne({ term, major }).lean();
    const result = capacity && Array.isArray(capacity.examinerLimits) && capacity.examinerLimits.length > 0;
    return result;
  } catch (error) {
    return false;
  }
};

const getUserExaminerCapacity = async ({ term, major, examinerId }) => {
  if (!term || !major || !examinerId) {
    return 0;
  }
  try {
    const capacity = await Capacity.findOne({ term, major }).lean();
    if (!capacity || !Array.isArray(capacity.examinerLimits)) {
      return 0;
    }
    const examinerLimit = capacity.examinerLimits.find(el => el.examinerId.toString() === examinerId.toString());
    const result = examinerLimit ? Number(examinerLimit.limit || 0) : 0;
    return result;
  } catch (error) {
    return 0;
  }
};

const countTotalSlots = (slots) => {
  return (slots || []).reduce((sum, s) => {
    return (
      sum +
      (s.proposedDates || []).reduce(
        (inner, pd) => inner + (pd.timeSlots || []).length,
        0
      )
    );
  }, 0);
};

export const submitDefenseSlots = async (req, res) => {
  try {
    const { term, proposedDates } = req.body;
    const examinerId = req.user.id;
    
    // اول چک می‌کنیم که آیا مدیر گروه ظرفیت‌ها را برای این ترم تعیین کرده یا نه
    const capacityExists = await checkCapacityExists({
      term,
      major: req.user.major,
    });

    if (!capacityExists) {
      return res.status(400).json({
        error: "مدیر گروه هنوز ظرفیت‌های دفاع را برای این ترم تعیین نکرده است. تا زمانی که ظرفیت‌ها مشخص نشوند، نمی‌توانید تاریخ‌های پیشنهادی خود را اعلام کنید.",
        capacityExists: false
      });
    }

    // چک می‌کنیم که آیا این استاد در لیست داوران این ترم قرار دارد یا نه
    const userCapacity = await getUserExaminerCapacity({
      term,
      major: req.user.major,
      examinerId
    });

    if (userCapacity === 0) {
      return res.status(400).json({
        error: "شما در لیست داوران این ترم قرار ندارید یا ظرفیت شما تعیین نشده است. لطفاً با مدیر گروه تماس بگیرید."
      });
    }
    
    // نرمال‌سازی تاریخ‌ها به نوع تاریخ و اعتبارسنجی بازه‌ها
    const normalized = Array.isArray(proposedDates)
      ? proposedDates
          .map((pd) => {
            const dateStr = pd?.date;
            const ts = Array.isArray(pd?.timeSlots)
              ? pd.timeSlots.filter(
                  (t) => typeof t === "string" && t.includes(":")
                )
              : [];
            const dateObj = dateStr
              ? new Date(`${dateStr}T00:00:00.000Z`)
              : null;
            return dateObj ? { date: dateObj, timeSlots: ts } : null;
          })
          .filter(Boolean)
      : [];

    if (!normalized.length) {
      return res
        .status(400)
        .json({ error: "تاریخ یا بازه زمانی معتبر ارسال نشده است" });
    }

    // بررسی تعداد اسلات برای تایید - هر استاد باید حداقل به تعداد بیشترین ظرفیت اسلات پیشنهاد دهد
    const requiredSlots = await getRequiredSlotsForTerm({
      term,
      major: req.user.major,
    });
    const currentExaminerSlots = normalized.reduce(
      (sum, pd) => sum + (pd.timeSlots || []).length,
      0
    );

    if (currentExaminerSlots < requiredSlots) {
      return res.status(400).json({
        error: `تعداد اسلات کافی نیست. بر اساس بیشترین ظرفیت داوران (${requiredSlots} پروژه)، شما باید حداقل ${requiredSlots} اسلات (${requiredSlots/2} ساعت) پیشنهاد دهید. در حال حاضر ${currentExaminerSlots} اسلات پیشنهاد داده‌اید.`,
        requiredSlots,
        currentSlots: currentExaminerSlots,
        maxCapacity: requiredSlots,
        requiredHours: requiredSlots/2
      });
    }

    let slot = await DefenseSlot.findOne({ examinerId, term });
    if (!slot) {
      slot = new DefenseSlot({ examinerId, term, proposedDates: normalized });
    } else {
      slot.proposedDates = normalized;
      slot.updatedAt = new Date();
    }

    await slot.save();
    // پس از ذخیره اسلات، پروژه‌های همین داور/ترم که تاریخ ندارند را زمان‌بندی کن
    await autoScheduleForExaminer({ examinerId, term });

    const finalMySlots = normalized.reduce(
      (sum, pd) => sum + (pd.timeSlots || []).length,
      0
    );

    res.json({ 
      slot, 
      requiredSlots, 
      mySlots: finalMySlots,
      message: `شما ${finalMySlots} اسلات (${finalMySlots/2} ساعت) پیشنهاد داده‌اید`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// زمان‌بندی پروژه‌های بدون تاریخ برای یک داور و ترم مشخص
const autoScheduleForExaminer = async ({ examinerId, term }) => {
  // جمع‌آوری اسلات‌های در دسترس
  const slots = await DefenseSlot.find({ examinerId, term });
  const available = [];
  for (const s of slots) {
    for (const pd of s.proposedDates || []) {
      for (const t of pd.timeSlots || []) {
        const taken = (s.approvedSlots || []).some((as) => {
          if (!as.date || !pd.date) return false;
          const sameDay =
            new Date(as.date).toISOString().slice(0, 10) ===
            new Date(pd.date).toISOString().slice(0, 10);
          return sameDay && as.time === t;
        });
        if (!taken) available.push({ slotId: s._id, date: pd.date, time: t });
      }
    }
  }

  if (!available.length) return;

  // پروژه‌های بدون تاریخ این داور در این ترم
  const projects = await Project.find({
    examinerId,
    term,
    defenseDate: null,
    status: { $in: ["topic_approved"] },
  }).sort({ createdAt: 1 });

  for (const project of projects) {
    if (!available.length) break;
    const chosen = available.shift();
    project.defenseDate = chosen.date;
    project.defenseTime = chosen.time;
    project.status = "scheduled";
    await project.save();

    await DefenseSlot.findByIdAndUpdate(chosen.slotId, {
      $push: {
        approvedSlots: {
          date: chosen.date,
          time: chosen.time,
          studentId: project.studentId?._id || project.studentId,
        },
      },
    });
  }
};

export const getExaminerSlots = async (req, res) => {
  try {
    const slots = await DefenseSlot.find({ examinerId: req.user.id }).populate(
      "examinerId"
    );
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all defense slots for a term (for manager to view)
export const getDefenseSlotsForTerm = async (req, res) => {
  try {
    const { term } = req.query;
    if (!term) {
      return res.status(400).json({ error: "ترم مشخص نشده است" });
    }
    const slots = await DefenseSlot.find({ term }).populate("examinerId");
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSlotRequirements = async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({ error: "ترم مشخص نشده است" });
    }

    if (!req.user || !req.user.major) {
      return res.status(400).json({ error: "اطلاعات کاربر کامل نیست" });
    }

    // چک کردن وجود ظرفیت برای این ترم
    const capacityExists = await checkCapacityExists({
      term,
      major: req.user.major,
    });

    if (!capacityExists) {
      return res.json({
        term,
        capacityExists: false,
        message: "مدیر گروه هنوز ظرفیت‌های دفاع را برای این ترم تعیین نکرده است.",
        requiredSlots: 0,
        totalSlots: 0,
        userCapacity: 0,
        canSubmit: false
      });
    }

    // اطلاعات مورد نیاز را محاسبه می‌کنیم
    const requiredSlots = await getRequiredSlotsForTerm({
      term,
      major: req.user.major,
    });

    const userCapacity = await getUserExaminerCapacity({
      term,
      major: req.user.major,
      examinerId: req.user.id
    });

    // اسلات‌های فعلی همه اساتید
    const allSlots = await DefenseSlot.find({ term });
    const totalSlots = countTotalSlots(allSlots);

    // اسلات‌های فعلی این استاد
    const userSlots = await DefenseSlot.findOne({ examinerId: req.user.id, term });
    const mySlots = userSlots ? countTotalSlots([userSlots]) : 0;

    const result = {
      term,
      capacityExists: true,
      requiredSlots,
      requiredHours: requiredSlots / 2,
      totalSlots,
      userCapacity,
      mySlots,
      myHours: mySlots / 2,
      canSubmit: userCapacity > 0,
      message: userCapacity === 0 
        ? "شما در لیست داوران این ترم قرار ندارید یا ظرفیت شما تعیین نشده است."
        : `شما باید حداقل ${requiredSlots} اسلات (${requiredSlots/2} ساعت) پیشنهاد دهید. در حال حاضر ${mySlots} اسلات (${mySlots/2} ساعت) پیشنهاد داده‌اید.`
    };
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const scheduleDefense = async (req, res) => {
  try {
    const { projectId, date, time } = req.body;

    // Update project with defense schedule
    await Project.findByIdAndUpdate(
      projectId,
      { defenseDate: date, defenseTime: time, status: "scheduled" },
      { new: true }
    );

    res.json({ message: "Defense scheduled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// دریافت جزئیات ظرفیت‌های تعیین شده برای یک ترم
export const getCapacityDetails = async (req, res) => {
  try {
    const { term } = req.query;
    if (!term) {
      return res.status(400).json({ error: "ترم مشخص نشده است" });
    }

    const capacity = await Capacity.findOne({ 
      term, 
      major: req.user.major 
    }).populate('examinerLimits.examinerId', 'firstName lastName');

    if (!capacity) {
      return res.json({
        term,
        capacityExists: false,
        message: "ظرفیت برای این ترم تعیین نشده است"
      });
    }

    const maxExaminerCapacity = capacity.examinerLimits.reduce(
      (max, examiner) => Math.max(max, Number(examiner.limit || 0)),
      0
    );

    res.json({
      term,
      capacityExists: true,
      totalCapacity: capacity.capacity,
      enrolled: capacity.enrolled,
      maxExaminerCapacity,
      requiredSlotsPerExaminer: maxExaminerCapacity,
      requiredHoursPerExaminer: maxExaminerCapacity / 2,
      examiners: capacity.examinerLimits.map(examiner => ({
        examinerId: examiner.examinerId._id,
        examinerName: `${examiner.examinerId.firstName} ${examiner.examinerId.lastName}`,
        limit: examiner.limit,
        assigned: examiner.assigned
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// endpoint تست برای چک کردن وضعیت ظرفیت‌ها
export const testCapacityStatus = async (req, res) => {
  try {
    const { term } = req.query;
    
    // گرفتن تمام ظرفیت‌های موجود
    const allCapacities = await Capacity.find({}).lean();
    
    // گرفتن ظرفیت مخصوص این ترم و رشته
    const specificCapacity = await Capacity.findOne({ term, major: req.user.major }).lean();
    
    // بررسی وجود کاربر در لیست داوران
    let userInList = false;
    if (specificCapacity && specificCapacity.examinerLimits) {
      userInList = specificCapacity.examinerLimits.some(el => el.examinerId.toString() === req.user.id.toString());
    }
    
    res.json({
      term,
      major: req.user.major,
      userId: req.user.id,
      totalCapacitiesInDB: allCapacities.length,
      specificCapacityFound: !!specificCapacity,
      userInExaminerList: userInList,
      capacityDetails: specificCapacity,
      allCapacities: allCapacities.map(c => ({ term: c.term, major: c.major }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// endpoint ساده برای چک کردن اطلاعات کاربر
export const debugUserInfo = async (req, res) => {
  try {
    res.json({
      user: req.user,
      headers: {
        authorization: req.headers.authorization ? 'Present' : 'Missing'
      },
      query: req.query,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
