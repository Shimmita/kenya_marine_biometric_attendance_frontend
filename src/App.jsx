import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import api from "./service/Api";
const HomeLanding = lazy(() => import("./components/BodyLanding"));
const DashboardHome = lazy(() => import("./components/Dashboard"));
const AuthCheck = lazy(() => import("./components/auth/AuthCheck"));
const ResetPasswordPage = lazy(() => import("./components/ResetPasswordPage"));
const VerifyDocument = lazy(() => import("./components/VerifyDocument"));

const RouteFallback = () => (
  <div className="app-route-fallback" role="status" aria-live="polite">
    <span className="app-route-spinner" />
  </div>
);

function ReminderTrigger() {
  useEffect(() => {
    const storageKey = "kmfri_reminder_triggered";
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(storageKey) === "1") return;

    const triggerReminder = async () => {
      try {
        const secret = import.meta.env.VITE_REMINDER_TRIGGER_SECRET || (import.meta.env.DEV ? "kmfri-reminder-trigger-dev" : "");
        const response = await api.post(
          "/notifications/trigger-reminders",
          {},
          {
            headers: secret ? { "x-reminder-trigger-secret": secret } : {},
          }
        );

        if (response?.status < 400) {
          window.sessionStorage.setItem(storageKey, "1");
        }
      } catch (error) {
        console.error("Reminder trigger failed:", error?.response?.data || error?.message || error);
      }
    };

    triggerReminder();
  }, []);

  return null;
}

function App() {

  return (

    <BrowserRouter>
      <ReminderTrigger />
      <Suspense fallback={<RouteFallback />}>
        <Routes>

          {/* Homepage (Public but redirects if logged in) */}
          <Route
            path="/"
            element={
              <AuthCheck redirectIfAuth={true}>
                <HomeLanding />
              </AuthCheck>
            }
          />

          {/* Dashboard (Protected) */}
          <Route
            path="/dashboard"
            element={
              <AuthCheck>
                <DashboardHome />
              </AuthCheck>
            }
          />

          {/* Document Verification (Public) */}
          <Route
            path="/verify/:token"
            element={<VerifyDocument />}
          />
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
