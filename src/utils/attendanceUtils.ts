export interface CalendarOverride {
    id: string;
    date: string;
    day_type: 'work' | 'half_day' | 'off_paid' | 'off_unpaid' | 'special';
    pay_rate: number;
    bonus_fixed: number;
    custom_start_time?: string;
    custom_end_time?: string;
    note?: string;
}

export const getDayConfig = (dateStr: string, overrides: CalendarOverride[], globalSettings: any) => {
    const date = new Date(dateStr);

    // A. Check Override First (Priority #1)
    const override = overrides.find(o => o.date === dateStr);
    if (override) {
        return {
            type: override.day_type,
            rate: override.pay_rate, // Multiplier (e.g., 1.5)
            bonus: override.bonus_fixed, // Fixed Addition (e.g., 500)
            start: override.custom_start_time || globalSettings?.official_start_time,
            end: override.custom_end_time || globalSettings?.official_end_time,
            is_off: override.day_type === 'off_paid' || override.day_type === 'off_unpaid',
            note: override.note,
            source: 'calendar'
        };
    }

    // B. Check Week Defaults (Priority #2)
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[date.getDay()];
    const daySetting = globalSettings?.day_settings?.[dayName];

    if (daySetting) {
        // If day_settings has rate/bonus/type, use them. Currently it mostly has is_off/start/end.
        // We can plan for future expansion here.
        return {
            type: daySetting.is_off ? 'off_paid' : 'work',
            rate: daySetting.pay_rate || 1.0,
            bonus: daySetting.bonus_fixed || 0,
            start: daySetting.start_time || globalSettings?.official_start_time,
            end: daySetting.end_time || globalSettings?.official_end_time,
            is_off: daySetting.is_off,
            note: '',
            source: 'week_default'
        };
    }

    // C. Global Fallback (Priority #3)
    const isWeekend = globalSettings?.weekend_days?.includes(date.getDay());

    return {
        type: isWeekend ? 'off_paid' : 'work',
        rate: 1.0,
        bonus: 0,
        start: globalSettings?.official_start_time || '08:00',
        end: globalSettings?.official_end_time || '15:45',
        is_off: isWeekend,
        note: '',
        source: 'global'
    };
};
