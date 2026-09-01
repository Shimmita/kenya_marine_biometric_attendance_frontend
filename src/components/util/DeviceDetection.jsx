import {
    Computer,
    LaptopMac,
    PhoneAndroid,
} from '@mui/icons-material';

const detectCurrentDevice = () => {
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    let deviceName = 'This Device';
    let deviceIcon = <Computer />;

    if (/Windows/.test(ua)) os = 'Windows';
    else if (/Mac OS X/.test(ua)) os = 'macOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iPhone|iPad/.test(ua)) os = 'iOS';
    else if (/Linux/.test(ua)) os = 'Linux';

    const isMobile = /Android|iPhone|iPad/.test(ua);
    if (isMobile) {
        deviceName = /iPad/.test(ua) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : 'Mobile Device';
        deviceIcon = <PhoneAndroid />;
    } else {
        deviceName = /Mac OS X/.test(ua) ? 'MacBook' : /Windows/.test(ua) ? 'Windows PC' : 'Desktop / Laptop';
        deviceIcon = <LaptopMac />;
    }

    let browser = 'Unknown Browser';
    if (/Edg\//.test(ua)) browser = 'Microsoft Edge';
    else if (/Chrome\//.test(ua)) browser = 'Chrome';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';
    else if (/Safari\//.test(ua)) browser = 'Safari';

    return {
        deviceName,
        os,
        browser,
        deviceIcon,
    };
};

export default detectCurrentDevice;
