import api from "./Api";


// clocking in
export const clockInUser = async () => {
  try {
    const res = await api.post("/attendance/clockin");
    return res.data;
  } catch (err) {
    throw err.response?.data?.message || "Clock-in failed";
  }
};


// clocking out
export const clockOutUser = async () => {
  try {
    const res = await api.post("/attendance/clockout");
    return res.data;
  } catch (err) {
    throw err.response?.data?.message || "Clock-out failed";
  }
};


// fetch clocking history for user
export const fetchClockingHistory = async (limit) => {
  try {
    const res = await api.get(`user/attendance/history?limit=${limit}`);
    return res.data;
  } catch (err) {
    throw err.response?.data?.message || "Failed to fetch clocking history";
  }
};

// for user
export const fetchAttendanceStats = async () => {
  try {
    const res = await api.get("/user/attendance/stats");
    return res.data;
  } catch (err) {
    throw err.response?.data?.message || "Failed to fetch statistics";
  }
};

//for overall org
export const fetchOverallOrgStats = async (params = {}) => {
  try {
    const res = await api.get(
      "/overall/attendance/stats",
      {
        params,
      }
    );

    return res.data;
  } catch (err) {
    throw (
      err.response?.data?.message ||
      "Failed to fetch statistics"
    );
  }
};

// fetch dept stats
export const fetchDepartmentStats = async (department) => {
  try {
    const res = await api.get(`/supervisor/department/stats`);
    return res.data;
  } catch (err) {
    throw err.response?.data?.message || "Failed to fetch department stats";
  }
};


// added
export const fetchOverallAttendanceRecords = async (params = {}) => {
  const res = await api.get("/overall/attendance/records", { params });
  return res.data;
};


// ============================================================================
// MONTHLY ATTENDANCE SUMMARY
// ============================================================================

export const fetchOverallAttendanceSummary = async (params = {}) => {
  try {

    const res = await api.get(
      "/overall/attendance/summary",
      {
        params,
      }
    );

    return res.data;

  } catch (err) {

    throw (
      err.response?.data?.message ||
      "Failed to fetch attendance summary"
    );

  }
};


// EXTENDED ANALYTICS

// ============================================================================
// HR & CEO ANALYTICS
// ============================================================================

// Dashboard KPIs
export const fetchAnalyticsKPIs = async (params = {}) => {
  try {
    const res = await api.get("/overall/attendance/analytics/kpis", {
      params,
    });

    return res.data;
  } catch (err) {
    throw (
      err.response?.data?.message ||
      "Failed to fetch dashboard KPIs"
    );
  }
};

// Attendance Trends
export const fetchAttendanceTrends = async (params = {}) => {
  try {
    const res = await api.get("/overall/attendance/analytics/trends", {
      params,
    });

    return res.data;
  } catch (err) {
    throw (
      err.response?.data?.message ||
      "Failed to fetch attendance trends"
    );
  }
};

// Department Analytics
export const fetchDepartmentAnalytics = async (params = {}) => {
  try {
    const res = await api.get(
      "/overall/attendance/analytics/departments",
      { params }
    );

    return res.data;
  } catch (err) {
    throw (
      err.response?.data?.message ||
      "Failed to fetch department analytics"
    );
  }
};

// Station Analytics
export const fetchStationAnalytics = async (params = {}) => {
  try {
    const res = await api.get(
      "/overall/attendance/analytics/stations",
      { params }
    );

    return res.data;
  } catch (err) {
    throw (
      err.response?.data?.message ||
      "Failed to fetch station analytics"
    );
  }
};

// Late Arrival Analytics
export const fetchLateArrivalAnalytics = async (params = {}) => {
  try {
    const res = await api.get(
      "/overall/attendance/analytics/late-arrivals",
      { params }
    );

    return res.data;
  } catch (err) {
    throw (
      err.response?.data?.message ||
      "Failed to fetch late arrival analytics"
    );
  }
};

// Early Departure Analytics
export const fetchEarlyDepartureAnalytics = async (params = {}) => {
  try {
    const res = await api.get(
      "/overall/attendance/analytics/early-departures",
      { params }
    );

    return res.data;
  } catch (err) {
    throw (
      err.response?.data?.message ||
      "Failed to fetch early departure analytics"
    );
  }
};

// Absenteeism Analytics
export const fetchAbsenteeismAnalytics = async (params = {}) => {
  try {
    const res = await api.get(
      "/overall/attendance/analytics/absenteeism",
      { params }
    );

    return res.data;
  } catch (err) {
    throw (
      err.response?.data?.message ||
      "Failed to fetch absenteeism analytics"
    );
  }
};

// Compliance Monitoring
export const fetchComplianceAnalytics = async (params = {}) => {
  try {
    const res = await api.get(
      "/overall/attendance/analytics/compliance",
      { params }
    );

    return res.data;
  } catch (err) {
    throw (
      err.response?.data?.message ||
      "Failed to fetch compliance analytics"
    );
  }
};

// Outside Clocking Analytics
export const fetchOutsideClockingAnalytics = async (params = {}) => {
  try {
    const res = await api.get(
      "/overall/attendance/analytics/outside-clocking",
      { params }
    );

    return res.data;
  } catch (err) {
    throw (
      err.response?.data?.message ||
      "Failed to fetch outside clocking analytics"
    );
  }
};

// Workforce Analytics
export const fetchWorkforceAnalytics = async (params = {}) => {
  try {
    const res = await api.get(
      "/overall/attendance/analytics/workforce",
      { params }
    );

    return res.data;
  } catch (err) {
    throw (
      err.response?.data?.message ||
      "Failed to fetch workforce analytics"
    );
  }
};

// Productivity Analytics
export const fetchProductivityAnalytics = async (params = {}) => {
  try {
    const res = await api.get(
      "/overall/attendance/analytics/productivity",
      { params }
    );

    return res.data;
  } catch (err) {
    throw (
      err.response?.data?.message ||
      "Failed to fetch productivity analytics"
    );
  }
};

// Executive Dashboard
export const fetchExecutiveAnalytics = async (params = {}) => {
  try {
    const res = await api.get(
      "/overall/attendance/analytics/executive",
      { params }
    );

    return res.data;
  } catch (err) {
    throw (
      err.response?.data?.message ||
      "Failed to fetch executive analytics"
    );
  }
};