import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy } from "react";
const HomeLanding = lazy(() => import("./components/BodyLanding"));
const DashboardHome = lazy(() => import("./components/Dashboard"));
const AuthCheck = lazy(() => import("./components/auth/AuthCheck"));

function App() {
  return (

    <BrowserRouter>
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

      </Routes>
    </BrowserRouter>
  );
}

export default App;
