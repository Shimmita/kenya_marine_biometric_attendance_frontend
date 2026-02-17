const normalizeCoord = (value) => {
    return Number(value.toFixed(4)); // round to 4 decimals
};

export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
    // Normalize all inputs to 4 decimal places
    lat1 = normalizeCoord(lat1);
    lon1 = normalizeCoord(lon1);
    lat2 = normalizeCoord(lat2);

    const R = 6371000; // Earth radius in meters
    const toRad = (value) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);



    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // return clean integer meters
};