async function reverseGeocode({ latitude, longitude }) {
    const url = new URL(import.meta.env.VITE_PLACE_NAME_BASE_ROUTE);
    url.searchParams.set('latitude', latitude);
    url.searchParams.set('longitude', longitude);
    url.searchParams.set('localityLanguage', 'en');

    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) throw new Error(`failed to get location: ${res.status}`);
    
    const data = await res.json();
    console.log('Reverse geocoding result:', data);

    // Default fallbacks
    let county = "Unknown County";
    let locality = "Unknown Sub-County";
    let ward = "Unknown Ward";

    if (data && data.localityInfo && Array.isArray(data.localityInfo.administrative)) {
        const adminArray = data.localityInfo.administrative;

        // 1. Level 4: County / Main City (e.g., Mombasa)
        const countyItem = adminArray.find(item => item.adminLevel === 4);
        if (countyItem && countyItem.name) {
            county = countyItem.name;
        }

        // 2. Level 6: Sub-County / Constituency / Locality (e.g., Nyali)
        const localityItem = adminArray.find(item => item.adminLevel === 6);
        if (localityItem && localityItem.name) {
            locality = localityItem.name;
        }

        // 3. Level 8: Ward (e.g., Mkomani ward)
        const wardItem = adminArray.find(item => item.adminLevel === 8);
        if (wardItem && wardItem.name) {
            // Strips out the word "ward" or "Ward" dynamically
            ward = wardItem.name.replace(/\bward\b/gi, '').trim(); 
        }
    }

    return {
        data: `${county} | ${locality} | ${ward}`
    };
}

export default reverseGeocode;