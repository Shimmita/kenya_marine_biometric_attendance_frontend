import axios from "axios";
const normalize = (str = "") =>
  str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");

/**
 * Remove unwanted words and normalize.
 */
const cleanName = (
  value = "",
  wordsToRemove = []
) => {
  let result = value;

  wordsToRemove.forEach((word) => {
    result = result.replace(
      new RegExp(`\\b${word}\\b`, "gi"),
      ""
    );
  });

  return normalize(result.trim());
};

/**
 * Build:
 * county.state.ward
 */
const buildLocationString = (
  county,
  locality,
  ward
) => {
  const parts = [
    county,
    locality,
    ward,
  ]
    .filter(Boolean)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length
    ? parts.join(".")
    : "unknown";
};

/**
 * Check whether result is detailed enough.
 */
const hasEnoughDetail = (
  locationString
) => {
  if (
    !locationString ||
    locationString === "unknown"
  ) {
    return false;
  }

  return (
    locationString.split(".").length >= 2
  );
};

/**
 * Extract from primary provider
 */
const extractFromPrimaryProvider = (
  data
) => {
  try {
    const admin =
      data?.localityInfo
        ?.administrative || [];

    let county = "";
    let locality = "";
    let ward = "";

    county =
      data.principalSubdivision ||
      data.city ||
      data.locality ||
      "";

    county = cleanName(county, [
      "County",
    ]);

    const wardEntry = admin.find(
      (item) =>
        item.name &&
        /ward/i.test(item.name)
    );

    if (wardEntry) {
      ward = cleanName(
        wardEntry.name,
        ["Ward"]
      );
    }

    const localityEntry = admin.find(
      (item) =>
        item.name &&
        item.name !== county &&
        item.name !== wardEntry?.name &&
        item.adminLevel >= 5
    );

    if (localityEntry) {
      locality = cleanName(
        localityEntry.name
      );
    }

    return buildLocationString(
      county,
      locality,
      ward
    );
  } catch (error) {
    console.error(
      "Primary extraction failed:",
      error
    );

    return "unknown";
  }
};

/**
 * Extract from Nominatim
 */
const extractFromNominatim = (
  data
) => {
  try {
    const address =
      data?.address || {};

    let county = "";
    let locality = "";
    let ward = "";

    county =
      address.state ||
      address.region ||
      "";

    locality =
      address.county ||
      address.subcounty ||
      "";

    ward =
      address.city ||
      address.suburb ||
      address.village ||
      address.town ||
      address.hamlet ||
      "";

    county = cleanName(county, [
      "County",
    ]);

    locality = cleanName(locality);

    ward = cleanName(ward, [
      "Ward",
    ]);

    return buildLocationString(
      county,
      locality,
      // freezed ward
    );
  } catch (error) {
    console.error(
      "Nominatim extraction failed:",
      error
    );

    return "unknown";
  }
};

/**
 * Reverse Geocoder
 */
async function reverseGeocode({
  latitude,
  longitude,
}) {
  // =====================================
  // PRIMARY PROVIDER
  // =====================================
  try {
    const url = new URL(
      import.meta.env
        .VITE_PLACE_NAME_BASE_ROUTE
    );

    url.searchParams.set(
      "latitude",
      latitude
    );

    url.searchParams.set(
      "longitude",
      longitude
    );

    url.searchParams.set(
      "localityLanguage",
      "en"
    );

    const res = await fetch(
      url.toString()
    );

    if (res.ok) {
      const data =
        await res.json();


      const location =
        extractFromPrimaryProvider(
          data
        );
      // Only accept detailed results
      if (
        hasEnoughDetail(location)
      ) {
        return {
          success: true,
          provider: "primary",
          data: location,
        };
      }
    }
  } catch (error) {
    console.warn(
      "Primary provider failed:",
      error.message
    );
  }

  // =====================================
  // NOMINATIM FALLBACK
  // =====================================
  try {
    const response =
      await axios.get(
        import.meta.env.VITE_PLACE_BACKEND_BASE_ROUTE,
        {
          params: {
            format: "jsonv2",
            lat: latitude,
            lon: longitude,
          },
          headers: {
            "User-Agent":
              import.meta.env.VITE_APP_NAME ||
              "KMFRI_Attendance_System/1.0",
          },
        }
      );


    const location =
      extractFromNominatim(
        response.data
      );


    if (
      location !== "unknown"
    ) {
      return {
        success: true,
        provider: "nominatim",
        data: location,
      };
    }
  } catch (error) {
    console.warn(
      "Nominatim failed:",
      error.message
    );
  }

  // =====================================
  // FINAL FALLBACK
  // =====================================
  return {
    success: false,
    provider: null,
    data: "unknown",
  };
}

export default reverseGeocode;