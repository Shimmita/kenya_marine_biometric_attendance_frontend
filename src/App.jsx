import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomeLanding from "./components/BodyLanding"
import DashboardHome from "./components/Dashboard"
import AuthCheck from './components/auth/AuthCheck'
function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthCheck><HomeLanding /></AuthCheck>} />
        <Route path="/dashboard" element={<AuthCheck><DashboardHome /></AuthCheck>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
