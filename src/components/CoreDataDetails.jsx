const readCachedPlatformConfig = () => {
    try {
        if (typeof localStorage === 'undefined') return null;
        return JSON.parse(localStorage.getItem('kmfri_platform_config') || 'null');
    } catch (err) {
        return null;
    }
};

const normalizeStation = (station, fallbackRadius = 500) => {
    if (typeof station === 'string') {
        return { name: station, lat: 0, lng: 0, radiusMeters: fallbackRadius, active: true };
    }
    return {
        name: station?.name || '',
        lat: Number(station?.lat || 0),
        lng: Number(station?.lng || 0),
        radiusMeters: Number(station?.radiusMeters || fallbackRadius),
        active: station?.active !== false,
    };
};

const cachedPlatformConfig = readCachedPlatformConfig();

const getActiveTheme = (config = {}) => {
    const themes = Array.isArray(config.themes) ? config.themes : [];
    return themes.find((theme) => theme.name === config.activeThemeName) || themes[0] || null;
};

const setCssVariables = (theme = {}, branding = {}) => {
    if (typeof document === 'undefined') return;
    const primary = theme.primaryColor || branding.primaryColor || '#0A3D62';
    const secondary = theme.secondaryColor || branding.secondaryColor || '#005B96';
    const accent = theme.accentColor || branding.accentColor || '#48C9B0';
    const surface = theme.surfaceColor || '#f8fafd';
    const text = theme.textColor || '#0f172a';
    const root = document.documentElement;

    root.style.setProperty('--kmfri-primary', primary);
    root.style.setProperty('--kmfri-secondary', secondary);
    root.style.setProperty('--kmfri-accent', accent);
    root.style.setProperty('--kmfri-surface', surface);
    root.style.setProperty('--kmfri-text', text);
    root.style.setProperty('--kmfri-primary-soft', `${primary}18`);
    root.style.setProperty('--kmfri-secondary-soft', `${secondary}16`);
    root.style.setProperty('--kmfri-accent-soft', `${accent}22`);
    root.style.setProperty('--kmfri-gradient', `linear-gradient(135deg, ${primary} 0%, ${secondary} 58%, ${accent} 100%)`);
    root.style.setProperty('--kmfri-shell-gradient', `linear-gradient(160deg, ${surface} 0%, ${secondary}14 52%, ${accent}12 100%)`);
};

const replaceArray = (target, values) => {
    if (!Array.isArray(target) || !Array.isArray(values)) return;
    target.splice(0, target.length, ...values);
};

const coreDataDetails = {
    availableDepartments: cachedPlatformConfig?.departments?.length ? cachedPlatformConfig.departments : [
        "Oceans and Coastal Systems & Blue Economy Research",
        "Marine and Coastal Fisheries Research",
        "Oceanography and Hydrography Research",
        "Freshwater Systems Research",
        "Freshwater Fisheries Research",
        "Limnology Research",
        "Aquaculture Research",
        "Freshwater Aquaculture Research",
        "Mariculture Research",
        "Socioeconomic Assessment and Monitoring",
        "Economic Valuation and Marketing",
        "Economic Analysis and Community Development",
        "Laboratory Services",
        "Maritime Services",
        "Finance and Accounting",
        "Human Resource Management and Administration",
        "Information Science",
        "Engineering and Maintenance",
        "Corporate Communication and Public Relations",
        "Strategy and Planning",
        "Performance Management, Monitoring and Evaluation",
        "Information Communication Technology (ICT)",
        "Partnership Development and Resource Mobilization",
        "Technical Capacity Building",
        "Quality Assurance and Compliance",
        "Business Development",
        "Corporation Secretary and Legal Services",
        "Internal Audit",
        "Supply Chain Management",
    ],
    availableSupervisors: [
        "Edna N. Onkundi",
        "Polycarp Atunga",
        "Samuel Agwata",
        "Faith Gwanda",
        "Leonard Opasanjo",
        "Peter Mutuku",
        "Lawrence Bruce Owili",
    ],
    colorPalette: {
        deepNavy: '#0A3D62',
        oceanBlue: '#005B96',
        marineBlue: '#1a237e',
        aquaVibrant: '#00e5ff',
        cyanFresh: '#368DC5',
        skyBlue: '#87CEEB',
        coralSunset: '#FF6F61',
        warmSand: '#FFB400',
        seafoamGreen: '#48C9B0',
        cloudWhite: '#f8fafd',
        softGray: '#E8EEF7',
        charcoal: '#424242',
        oceanGradient: 'linear-gradient(135deg, #0A3D62 0%, #005B96 50%, #1B4F72 100%)',
        sunsetGradient: 'linear-gradient(135deg, #FF6F61 0%, #FFB400 100%)',
        freshGradient: 'linear-gradient(135deg, #00e5ff 0%, #48C9B0 100%)',


    },

    C : {
        deepNavy: "#0A3D62",
        oceanBlue: "#005B96",
        marineBlue: "#1a237e",
        aquaVibrant: "#00e5ff",
        cyanFresh: "#3FC1FF",     // brighter
        skyBlue: "#87CEEB",
        coralSunset: "#FF5C4A",     // sharper
        warmSand: "#FFB400",
        seafoamGreen: "#48C9B0",
        cloudWhite: "#f8fafd",
        softGray: "#E8EEF7",
        charcoal: "#424242",

        // Surface / glass tokens
        glassBg: "rgba(10,61,98,0.68)",   // less transparent for readability
        glassBgElevated: "rgba(0,91,150,0.48)",
        glassBorder: "rgba(0,229,255,0.28)",
        glassBorderHover: "rgba(0,229,255,0.58)",

        textPrimary: "#E6F4FA",
        textSecondary: "rgba(190,228,245,0.85)", // sharper
        textMuted: "rgba(190,228,245,0.55)", // slightly more visible
    },

    AvailableStations: cachedPlatformConfig?.stations?.length
        ? cachedPlatformConfig.stations
            .map((station) => normalizeStation(station, cachedPlatformConfig?.geofence?.radiusMeters || 500))
            .filter((station) => station.name && station.active !== false)
        : [
        // { name: 'MOMBASA CENTRE', lat: -4.03951, lng: 39.6260 },
        { name: 'MOMBASA CENTRE', lat: -4.0546356, lng: 39.6826 },
        { name: 'SHIMONI CENTRE', lat: -4.0546356, lng: 39.6826 },
        { name: 'KISUMU CENTRE', lat: -0.059149, lng: 34.8066 },
        { name: 'KEGATI STATION', lat: -0.644496, lng: 34.7481 },
        { name: 'TURKANA STATION', lat: 3.08222, lng: 36.0749 },
        { name: 'NAIROBI STATION', lat: -1.24936, lng: 36.7968 },
        { name: 'NAIVASHA STATION', lat: -0.664008, lng: 36.4651 },
        { name: 'BARINGO STATION', lat: 0.604245, lng: 35.9773 },
        { name: 'SANGORO STATION', lat: -0.394861, lng: 34.7374 },
        { name: 'SAGANA CENTRE', lat: -0.669415, lng: 37.2061 },

        // added stations, they don't has lats and lon yet using mombasa's for now
        { name: 'GAZI STATION', lat: -4.0546356, lng: 39.6826 },
        { name: 'MUTONGA CENTER', lat: -4.0546356, lng: 39.6826 },

    ],
    genders: [
        'Male',
        'Female',
    ],

    REASONS: ["Sickness", "Fieldwork", "Workshop", "Official Assignment", "Emergency", "Other"],
    LEAVE_TYPES: ["Adoption Leave", "Annual Leave", "Compassionate Leave", "Paternity Leave", "Sick Leave", "Study Leave", "Terminal Leave"],
    branding: cachedPlatformConfig?.branding || {
        organizationName: "Kenya Marine and Fisheries Research Institute",
        shortName: "KMFRI",
    },
    notificationReminders: cachedPlatformConfig?.notificationReminders || {
        clockInReminderMinutes: 15,
        clockOutReminderMinutes: 15,
        clockInMessage: 'Dear {firstName}, please clock in for your scheduled KMFRI workday.',
        clockOutMessage: 'Dear {firstName}, please clock out before leaving your duty station.',
        channels: ['in_app'],
    },
    attendancePolicy: cachedPlatformConfig?.attendancePolicy || {
        standardClockIn: '08:00',
        standardClockOut: '17:00',
        gracePeriodMinutes: 15,
        allowClockOutsideStation: false,
        requireBiometricVerification: true,
    },

};

export const applyPlatformConfigToCoreData = (config = {}) => {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('kmfri_platform_config', JSON.stringify(config));
        }
    } catch (err) {
        console.warn('Failed to cache platform config', err);
    }

    if (Array.isArray(config.departments) && config.departments.length > 0) {
        replaceArray(coreDataDetails.availableDepartments, config.departments);
    }

    if (Array.isArray(config.stations) && config.stations.length > 0) {
        const stations = config.stations
            .map((station) => normalizeStation(station, config?.geofence?.radiusMeters || 500))
            .filter((station) => station.name && station.active !== false);
        replaceArray(coreDataDetails.AvailableStations, stations);
    }

    const dropdowns = config.dropdowns || {};
    if (Array.isArray(dropdowns.genders)) replaceArray(coreDataDetails.genders, dropdowns.genders);
    if (Array.isArray(dropdowns.leaveTypes)) replaceArray(coreDataDetails.LEAVE_TYPES, dropdowns.leaveTypes);
    if (Array.isArray(dropdowns.absenceReasons)) replaceArray(coreDataDetails.REASONS, dropdowns.absenceReasons);

    const activeTheme = getActiveTheme(config);
    const { branding } = config;
    if (branding) {
        Object.assign(coreDataDetails.branding, branding);
    }

    if (branding || activeTheme) {
        const primary = activeTheme?.primaryColor || branding?.primaryColor || coreDataDetails.colorPalette.deepNavy;
        const secondary = activeTheme?.secondaryColor || branding?.secondaryColor || coreDataDetails.colorPalette.oceanBlue;
        const accent = activeTheme?.accentColor || branding?.accentColor || coreDataDetails.colorPalette.seafoamGreen;
        const surface = activeTheme?.surfaceColor || coreDataDetails.colorPalette.cloudWhite;
        const text = activeTheme?.textColor || '#0f172a';

        setCssVariables(activeTheme, branding);

        Object.assign(coreDataDetails.colorPalette, {
            deepNavy: primary,
            oceanBlue: secondary,
            seafoamGreen: accent,
            cloudWhite: surface,
            charcoal: text,
            oceanGradient: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
            freshGradient: `linear-gradient(135deg, ${secondary} 0%, ${accent} 100%)`,
        });

        Object.assign(coreDataDetails.C, {
            deepNavy: primary,
            oceanBlue: secondary,
            seafoamGreen: accent,
            glassBg: `${primary}B8`,
            glassBgElevated: `${secondary}7A`,
            glassBorder: `${accent}47`,
            glassBorderHover: `${accent}94`,
        });
    }

    if (config.notificationReminders) {
        coreDataDetails.notificationReminders = {
            clockInReminderMinutes: config.notificationReminders.clockInReminderMinutes ?? coreDataDetails.notificationReminders.clockInReminderMinutes,
            clockOutReminderMinutes: config.notificationReminders.clockOutReminderMinutes ?? coreDataDetails.notificationReminders.clockOutReminderMinutes,
            clockInMessage: config.notificationReminders.clockInMessage || coreDataDetails.notificationReminders.clockInMessage,
            clockOutMessage: config.notificationReminders.clockOutMessage || coreDataDetails.notificationReminders.clockOutMessage,
            channels: Array.isArray(config.notificationReminders.channels)
                ? config.notificationReminders.channels
                : coreDataDetails.notificationReminders.channels,
        };
    }

    if (config.attendancePolicy) {
        coreDataDetails.attendancePolicy = {
            standardClockIn: config.attendancePolicy.standardClockIn || coreDataDetails.attendancePolicy.standardClockIn,
            standardClockOut: config.attendancePolicy.standardClockOut || coreDataDetails.attendancePolicy.standardClockOut,
            gracePeriodMinutes: Number(config.attendancePolicy.gracePeriodMinutes ?? coreDataDetails.attendancePolicy.gracePeriodMinutes),
            allowClockOutsideStation: config.attendancePolicy.allowClockOutsideStation ?? coreDataDetails.attendancePolicy.allowClockOutsideStation,
            requireBiometricVerification: config.attendancePolicy.requireBiometricVerification ?? coreDataDetails.attendancePolicy.requireBiometricVerification,
        };
    }
};

if (cachedPlatformConfig) {
    applyPlatformConfigToCoreData(cachedPlatformConfig);
} else {
    setCssVariables({}, coreDataDetails.branding);
}

export default coreDataDetails;
