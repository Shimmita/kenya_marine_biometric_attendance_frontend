import Api from "./Api";

/* =====================================================
   DASHBOARD
===================================================== */

export const getDashboardFull = async () => {

  const res = await Api.get(
    "/superadmin/dashboard/full"
  );

  return res.data;

};

/* =====================================================
   PLATFORM CONFIGURATION
===================================================== */

export const getPlatformConfig = async () => {
  const res = await Api.get("/superadmin/config");
  return res.data;
};

export const getMaintenanceStatus = async () => {
  const res = await Api.get("/maintenance/status");
  return res.data;
};

export const updatePlatformConfig = async (payload) => {
  const res = await Api.post("/superadmin/config", payload);
  return res.data;
};

export const resetPlatformConfig = async (section = "all") => {
  const res = await Api.post("/superadmin/config/reset", {
    section,
  });

  return res.data;
};

/* =====================================================
   HOLIDAYS
===================================================== */

export const getHolidays = async () => {
  const res = await Api.get("/holidays");
  return res.data;
};

export const addHoliday = async (payload) => {
  const res = await Api.post("/holidays", payload);
  return res.data;
};

export const removeHoliday = async (id) => {
  const res = await Api.delete(`/holidays/${id}`);
  return res.data;
};

export const getTodayHoliday = async () => {
  const res = await Api.get("/holidays/today");
  return res.data;
};

/* =====================================================
   DEPARTMENTS
===================================================== */

export const addDepartment = async (name) => {

  const res = await Api.post(
    "/superadmin/departments/add",
    { name }
  );

  return res.data;

};

export const removeDepartment = async (name) => {

  const res = await Api.post(
    "/superadmin/departments/remove",
    { name }
  );

  return res.data;

};

/* =====================================================
   STATIONS
===================================================== */

export const addStation = async (station) => {

  const payload =
    typeof station === "string"
      ? { name: station }
      : station;

  const res = await Api.post(
    "/superadmin/stations/add",
    payload
  );

  return res.data;

};

export const removeStation = async (name) => {

  const res = await Api.post(
    "/superadmin/stations/remove",
    { name }
  );

  return res.data;

};

/* =====================================================
   DROPDOWNS
===================================================== */

export const updateDropdown = async (key, values) => {

  const res = await Api.post(
    "/superadmin/dropdowns/update",
    {
      key,
      values,
    }
  );

  return res.data;

};

/* =====================================================
   SUPERADMIN
===================================================== */

export const createSuperadmin = async (payload) => {

  const res = await Api.post(
    "/superadmin/create-superadmin",
    payload
  );

  return res.data;

};



/* =====================================================
   EXPORTS
===================================================== */

export default {

  // Dashboard
  getDashboardFull,

  // Config
  getPlatformConfig,
  getMaintenanceStatus,
  updatePlatformConfig,
  resetPlatformConfig,
  getHolidays,
  addHoliday,
  removeHoliday,
  getTodayHoliday,

  // Departments
  addDepartment,
  removeDepartment,

  // Stations
  addStation,
  removeStation,

  // Dropdowns
  updateDropdown,

  // Users
  createSuperadmin,

};
