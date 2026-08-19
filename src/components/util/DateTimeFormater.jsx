const normalizeDateCandidates = (value) => {
  if (value === undefined || value === null || value === "") return [];
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? [] : [value];

  const entries = Array.isArray(value) ? value : [value];
  const candidates = [];

  entries.forEach((entry) => {
    if (entry === undefined || entry === null || entry === "") return;
    const raw = String(entry).trim();
    if (!raw || raw === "Invalid Date" || raw === "NaN") return;
    if (raw.includes(",")) {
      raw.split(",").map((part) => part.trim()).filter(Boolean).forEach((part) => candidates.push(part));
      return;
    }
    candidates.push(raw);
  });

  return candidates;
};

const safeParseDate = (value) => {
  const candidates = normalizeDateCandidates(value);

  for (const candidate of candidates) {
    const direct = new Date(candidate);
    if (!Number.isNaN(direct.getTime())) {
      return direct;
    }

    const isoMatch = candidate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]);
      const day = Number(isoMatch[3]);
      const explicit = new Date(year, month - 1, day);
      if (
        explicit.getFullYear() === year &&
        explicit.getMonth() === month - 1 &&
        explicit.getDate() === day
      ) {
        return explicit;
      }
    }
  }

  return null;
};

const safeNewDate = (value, fallback = null) => {
  const parsed = safeParseDate(value);
  return parsed ?? fallback;
};

const getLocalDateInputValue = (date = new Date()) => {
  const parsed = safeParseDate(date) || new Date();
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
  const parsed = safeParseDate(date);
  if (!parsed) return "—";

  return parsed.toLocaleDateString("en-GB", {
    timeZone: "Africa/Nairobi",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (date) => {
  const parsed = safeParseDate(date);
  if (!parsed) return "—";

  return parsed.toLocaleTimeString("en-KE", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).replace(" ", "");
};
export { formatDate, formatTime, getLocalDateInputValue, safeNewDate, safeParseDate };
