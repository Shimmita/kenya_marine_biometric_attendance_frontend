/**
 * Calculates Easter Sunday for any given year using the Gauss Easter Algorithm.
 * Returns an object with { month: 1-indexed, day: 1-indexed }
 */
const getEasterSunday = (year) => {
    const a = year % 19;
    const b = year % 4;
    const c = year % 7;
    const k = Math.floor(year / 100);
    const p = Math.floor((13 + 8 * k) / 25);
    const q = Math.floor(k / 4);
    const M = (15 - p + k - q) % 30;
    const N = (4 + k - q) % 7;
    const d = (19 * a + M) % 30;
    const e = (2 * b + 4 * c + 6 * d + N) % 7;
    const days = 22 + d + e;

    if (days <= 31) {
        return { month: 4, day: days }; // March has 31 days, offset flows into April
    } else {
        const aprilDay = days - 31;
        // Exception checks for Gauss algorithm overrides
        if (aprilDay === 26) return { month: 4, day: 19 };
        if (aprilDay === 25 && d === 28 && a > 10) return { month: 4, day: 18 };
        return { month: 4, day: aprilDay };
    }
};

/**
 * Main module function to calculate working days (Mon-Fri) 
 * excluding dynamically calculated Kenyan public holidays.
 */
const getWorkingDaysCount = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    // 1. Fixed Annual Holidays (MM-DD format) - Works automatically forever
    const fixedHolidays = [
        "01-01", // New Year's Day
        "05-01", // Labour Day
        "06-01", // Madaraka Day
        "10-10", // Mazingira / Utamaduni Day
        "10-20", // Mashujaa Day
        "12-12", // Jamhuri Day
        "12-25", // Christmas Day
        "12-26"  // Boxing Day
    ];

    // 2. Approximate Eid Mappings (Calculated for wide safety net up to 2033)
    // Lunar sights can vary by 1 day, but this keeps the count consistent
    const approximateEidFitr = {
        2026: "03-20", 2027: "03-10", 2028: "02-27", 2029: "02-15", 
        2030: "02-04", 2031: "01-24", 2032: "01-14", 2033: "01-03"
    };
    
    const approximateEidAdha = {
        2026: "05-27", 2027: "05-17", 2028: "05-05", 2029: "04-24",
        2030: "04-14", 2031: "04-03", 2032: "03-23", 2033: "03-12"
    };

    // Helper to check if a specific calendar date is a public holiday
    const isHoliday = (dateObj) => {
        const year = dateObj.getFullYear();
        const monthInt = dateObj.getMonth() + 1;
        const dayInt = dateObj.getDate();
        
        const monthStr = String(monthInt).padStart(2, '0');
        const dayStr = String(dayInt).padStart(2, '0');
        const mmDd = `${monthStr}-${dayStr}`;

        // A. Check Fixed Holidays
        if (fixedHolidays.includes(mmDd)) return true;

        // B. Check Eid Mappings
        if (approximateEidFitr[year] === mmDd || approximateEidAdha[year] === mmDd) return true;

        // C. Calculate Easter dynamically for the evaluated year
        const easter = getEasterSunday(year);
        
        // Good Friday is 2 days before Easter Sunday
        const goodFriday = new Date(year, easter.month - 1, easter.day - 2);
        // Easter Monday is 1 day after Easter Sunday
        const easterMonday = new Date(year, easter.month - 1, easter.day + 1);

        if (monthInt === (goodFriday.getMonth() + 1) && dayInt === goodFriday.getDate()) return true;
        if (monthInt === (easterMonday.getMonth() + 1) && dayInt === easterMonday.getDate()) return true;

        return false;
    };

    let workingDays = 0;
    const runner = new Date(start);

    while (runner <= end) {
        const dayOfWeek = runner.getDay(); // 0 = Sunday, 1 = Monday, 6 = Saturday

        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            let todayIsHoliday = isHoliday(runner);
            let shiftedFromSunday = false;

            // Kenyan Law: If a holiday falls on a Sunday, the following Monday is a holiday
            if (dayOfWeek === 1) { 
                const yesterdaySunday = new Date(runner);
                yesterdaySunday.setDate(yesterdaySunday.getDate() - 1);
                if (isHoliday(yesterdaySunday)) {
                    shiftedFromSunday = true;
                }
            }

            if (!todayIsHoliday && !shiftedFromSunday) {
                workingDays++;
            }
        }
        runner.setDate(runner.getDate() + 1);
    }

    return workingDays;
};

export default getWorkingDaysCount;