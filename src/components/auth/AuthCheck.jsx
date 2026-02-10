import { useLayoutEffect, useState } from "react";
import api from "../../service/Api";
import EnhancedDashboard from "../Dashboard";

const AuthCheck = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  // use layout effect to check the validity of the request
  useLayoutEffect(() => {
    api.get(`${import.meta.env.VITE_BACKEND_BASE_ROUTE}/valid`)
      .then(res => {
        if (res.data.valid) {
          setIsAuthenticated(true)
        }
      })
      .catch((err) => {
        console.log(err)
        setIsAuthenticated(false)
      })
  }, [])

  // check login status before proceeding
  return isAuthenticated ? <EnhancedDashboard /> : children
};

export default AuthCheck;