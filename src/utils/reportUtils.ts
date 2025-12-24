
export interface StageReport {
    stageId: string;
    stageName: string;
    classes: any[];
    summary: {
        totalClasses: number;
        totalEnrolled: number;
        totalPresent: number;
        totalAbsent: number;
        totalLate: number;
        totalExcused: number;
        avgAbsenceRate: number;
        avgAttendanceRate?: number;
        avgPresent?: number;
        avgAbsent?: number;
    } | null;
}

export interface LevelSummary {
    totalClasses: number;
    totalEnrolled: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalExcused: number;
    avgAbsenceRate: number; // Average of averages or weighted average
    avgAttendanceRate: number;
    avgPresent: number;
    avgAbsent: number;
}

export interface LevelReport {
    id: string; // 'kg', 'primary', 'middle', 'secondary', 'other'
    name: string; // 'مرحلة رياض الأطفال', etc.
    stages: StageReport[];
    summary: LevelSummary;
}

export const groupStagesByLevel = (stages: StageReport[]): LevelReport[] => {
    const levels: Record<string, LevelReport> = {
        kg: {
            id: 'kg',
            name: 'مرحلة رياض الأطفال (KG)',
            stages: [],
            summary: createEmptySummary(),
        },
        primary: {
            id: 'primary',
            name: 'المرحلة الابتدائية',
            stages: [],
            summary: createEmptySummary(),
        },
        middle: {
            id: 'middle',
            name: 'المرحلة الإعدادية',
            stages: [],
            summary: createEmptySummary(),
        },
        secondary: {
            id: 'secondary',
            name: 'المرحلة الثانوية',
            stages: [],
            summary: createEmptySummary(),
        },
        other: {
            id: 'other',
            name: 'مراحل أخرى',
            stages: [],
            summary: createEmptySummary(),
        },
    };

    stages.forEach((stage) => {
        const name = stage.stageName.toLowerCase();
        let levelId = 'other';

        if (name.includes('kg') || name.includes('رياض') || name.includes('تمهيدي')) {
            levelId = 'kg';
        } else if (name.includes('ابتدائ') || name.includes('الإبتدائ') || name.includes('بدايه')) {
            levelId = 'primary';
        } else if (name.includes('اعداد') || name.includes('إعداد') || name.includes('متوسط')) {
            levelId = 'middle';
        } else if (name.includes('ثانوي') || name.includes('ثانوى')) {
            levelId = 'secondary';
        }

        levels[levelId].stages.push(stage);
    });

    // Calculate summaries for each level and filter out empty levels
    return Object.values(levels)
        .filter((level) => level.stages.length > 0)
        .map((level) => {
            // Sort stages within the level
            level.stages.sort((a, b) => sortStagesByName({ name: a.stageName }, { name: b.stageName }));
            level.summary = calculateLevelSummary(level.stages);
            return level;
        });
};

const createEmptySummary = (): LevelSummary => ({
    totalClasses: 0,
    totalEnrolled: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    totalExcused: 0,
    avgAbsenceRate: 0,
    avgAttendanceRate: 0,
    avgPresent: 0,
    avgAbsent: 0,
});

const calculateLevelSummary = (stages: StageReport[]): LevelSummary => {
    const summary = createEmptySummary();

    // Aggregate absolute numbers
    stages.forEach((stage) => {
        if (stage.summary) {
            summary.totalClasses += stage.summary.totalClasses;
            summary.totalEnrolled += stage.summary.totalEnrolled;
            summary.totalPresent += stage.summary.totalPresent;
            summary.totalAbsent += stage.summary.totalAbsent;
            summary.totalLate += stage.summary.totalLate;
            summary.totalExcused += stage.summary.totalExcused;

            // Accumulate averages for later averaging (this is an approximation for periods)
            summary.avgPresent += stage.summary.avgPresent || 0;
            summary.avgAbsent += stage.summary.avgAbsent || 0;
        }
    });

    // Calculate Rates
    // Note: These calculations depend on whether the report is Daily (absolute) or Period (average)
    // For simplicity, we recalculate rates based on the aggregated totals if totals exist

    // Checking if we have valid totals to calculate rates
    if (summary.totalEnrolled > 0) {
        // For Daily Report Logic (Absolute numbers available)
        if (summary.totalPresent > 0 || summary.totalAbsent > 0) {
            // Re-calculate weighted rates if possible, otherwise use simple average
            // Here we try to replicate the logic: Rate = (Present / Enrolled)
            // But "Present" in daily report sums up students.
            // In period report, we might need average of averages if we don't have raw daily data availability here.

            // Let's rely on the aggregated counts for accuracy if available
            const totalAttending = summary.totalPresent + summary.totalLate;
            // For single day, this is correct. For period, totalPresent is actually Accumulative Present Days.
            // Wait, stage.summary structure from AnalyticsService:
            /*
              totalPresent: totalPresent, // Accumulative
              avgPresent: totalDays > 0 ? Math.round(totalPresent / totalDays) : 0,
            */

            // We should be careful. 
            // If it's a period report, we want the "Average Daily Attendance" stats.
            // The StageReport summary has `avgPresent` (daily average).
            // So for the Level Limit, `avgPresent` should be sum of `avgPresent` of all stages?
            // Yes: If Stage A has avg 50 present/day and Stage B has avg 30 present/day, Level has 80 present/day.

            // `summary.avgPresent` was accumulated above.

            summary.avgAttendanceRate = summary.totalEnrolled > 0
                ? Math.round((summary.avgPresent / summary.totalEnrolled) * 100 * 100) / 100
                : 0;

            summary.avgAbsenceRate = summary.totalEnrolled > 0
                ? Math.round((summary.avgAbsent / summary.totalEnrolled) * 100 * 100) / 100
                : 0;
        }
    }

    return summary;
};

export const calculateSchoolSummary = (stages: StageReport[]): LevelSummary => {
    const summary = createEmptySummary();

    // Filter out stages with no enrollment to match the report logic
    const activeStages = stages.filter(s => s.summary && s.summary.totalEnrolled > 0);

    activeStages.forEach(stage => {
        if (stage.summary) {
            summary.totalClasses += stage.summary.totalClasses;
            summary.totalEnrolled += stage.summary.totalEnrolled;
            summary.totalPresent += stage.summary.totalPresent;
            summary.totalAbsent += stage.summary.totalAbsent;
            summary.totalLate += stage.summary.totalLate;
            summary.totalExcused += stage.summary.totalExcused;

            // للتقارير الفترية: تجميع المتوسطات (متوسط الحضور اليومي لكل مرحلة)
            summary.avgPresent += stage.summary.avgPresent || 0;
            summary.avgAbsent += stage.summary.avgAbsent || 0;
        }
    });

    // Recalculate Rates based on the new totals
    if (summary.totalEnrolled > 0) {
        // Attendance Rate = ((Present + Late) / Enrolled) * 100
        // NOTE: This formula depends on whether report is Daily or Period
        // For Period, Enrolled is effectively Enrolled * Days. 
        // Assuming the Stage Summary has normalized totals (Total Enrolled Man-Days vs Total Present Man-Days)
        // If not, we use the simple sum if it's a daily report.

        // For safely, let's look at how stage summary calculates rate.
        // It seems based on totalPresent + totalLate.

        const totalAttending = summary.totalPresent + summary.totalLate;

        // We use Math.round to match the display format
        summary.avgAttendanceRate = Math.round((totalAttending / summary.totalEnrolled) * 100);
        summary.avgAbsenceRate = Math.round((summary.totalAbsent / summary.totalEnrolled) * 100);

        // CORRECTION: Ideally, for period reports, totalEnrolled should be sum of Potential Attendance (Student * Days).
        // If the backend returns 'totalEnrolled' as just 'current students count', then this formula is wrong for period reports.
        // However, assuming consistency with stage reports:

        // If the resulting rates are > 100%, it means totalEnrolled is static while Present is cumulative.
        // In that case, we should probably average the rates of the stages weighted by enrollment?

        // Alternative Weighted Average Approach (Safer if Enrolled is static count):
        if (summary.avgAttendanceRate > 100 || summary.avgAbsenceRate > 100) {
            let weightedAttendanceSum = 0;
            let weightedAbsenceSum = 0;
            let totalStudents = 0;

            activeStages.forEach(stage => {
                if (stage.summary) {
                    weightedAttendanceSum += (stage.summary.avgAttendanceRate || 0) * stage.summary.totalEnrolled;
                    weightedAbsenceSum += (stage.summary.avgAbsenceRate || 0) * stage.summary.totalEnrolled;
                    totalStudents += stage.summary.totalEnrolled;
                }
            });

            if (totalStudents > 0) {
                summary.avgAttendanceRate = Math.round(weightedAttendanceSum / totalStudents);
                summary.avgAbsenceRate = Math.round(weightedAbsenceSum / totalStudents);
            }
        }
    }

    return summary;
}

// Helper to get grade number from Arabic or English text
export const getGradeNumber = (stageName: string): number => {
    // 1. Explicit numbers (1, 2, 3...)
    const match = stageName.match(/(\d+)/);
    if (match) return parseInt(match[1]);

    // 2. Arabic number words
    const s = stageName;
    if (s.includes('الأول') || s.includes('الاول')) return 1;
    if (s.includes('الثاني') || s.includes('الكا جي 2') || s.includes('KG2') || s.includes('kg2')) return 2;
    if (s.includes('الثالث')) return 3;
    if (s.includes('الرابع')) return 4;
    if (s.includes('الخامس')) return 5;
    if (s.includes('السادس')) return 6;
    if (s.includes('السابع')) return 7;
    if (s.includes('الثامن')) return 8;
    if (s.includes('التاسع')) return 9;
    if (s.includes('العاشر')) return 10;
    if (s.includes('الحادي عشر')) return 11;
    if (s.includes('الثاني عشر')) return 12;

    // KG1
    if (s.includes('الكا جي 1') || s.includes('KG1') || s.includes('kg1')) return 1;

    return 0;
};

// Helper to determine educational level for sorting
export const getEducationalLevelForSorting = (stageName: string): number => {
    const lower = stageName.toLowerCase();
    if (lower.includes('kg') || lower.includes('رياض') || lower.includes('تمهيدي') || lower.includes('الكا جي')) return 0;
    if (lower.includes('ابتدائ') || lower.includes('primary')) return 1;
    if (lower.includes('إعداد') || lower.includes('prep')) return 2;
    if (lower.includes('ثانو') || lower.includes('secondary')) return 3;
    return 4;
};

export const sortStagesByName = (a: { name: string }, b: { name: string }): number => {
    const levelA = getEducationalLevelForSorting(a.name);
    const levelB = getEducationalLevelForSorting(b.name);
    if (levelA !== levelB) return levelA - levelB;

    const gradeA = getGradeNumber(a.name);
    const gradeB = getGradeNumber(b.name);
    if (gradeA !== gradeB) return gradeA - gradeB;

    return a.name.localeCompare(b.name, 'ar');
};
