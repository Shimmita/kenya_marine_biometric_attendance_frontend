import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomeLanding from "./components/BodyLanding";
import DashboardHome from "./components/Dashboard";
import AuthCheck from "./components/auth/AuthCheck";

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
