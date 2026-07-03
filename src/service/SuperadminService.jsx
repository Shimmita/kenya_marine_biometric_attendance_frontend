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
  updatePlatformConfig,
  resetPlatformConfig,

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