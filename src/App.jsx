import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

function App() {

  return (

    <BrowserRouter>
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
