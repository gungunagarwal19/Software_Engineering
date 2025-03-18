import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Movies from "./pages/movies";
import SearchCinemas from "./pages/cinema";
import SeatBooking from "./pages/seat";
import TicketPage from "./pages/ticket";
import PaymentPage from "./pages/payment";
import FoodSelection from "./pages/FoodSelection";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import CinemaDashboard from "./pages/CinemaDashboard";
import PrivateRoute from "./components/PrivateRoute"; // Role-based access control
import Profile_pg from "./pages/Profile";

const App = () => {
  const isAuthenticated = !!localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Ensure authentication before accessing Movies */}
        <Route path="/movies" element={isAuthenticated ? <Movies /> : <Navigate to="/login" />} />
        <Route path="/cinema" element={isAuthenticated ? <SearchCinemas /> : <Navigate to="/login" />} />
        <Route path="/seat" element={isAuthenticated ? <SeatBooking /> : <Navigate to="/login" />} />
        <Route path="/food-selection" element={isAuthenticated ? <FoodSelection /> : <Navigate to="/login" />} />
        <Route path="/ticket" element={isAuthenticated ? <TicketPage /> : <Navigate to="/login" />} />
        <Route path="/payment" element={isAuthenticated ? <PaymentPage /> : <Navigate to="/login" />} />
       
        <Route element={<PrivateRoute allowedRoles={["User"]} />}>
          <Route path="/user-dashboard" element={<UserDashboard />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={["Cinema Owner"]} />}>
          <Route path="/cinema-dashboard" element={<CinemaDashboard />} />
        </Route>

        <Route path="/unauthorized" element={<h1>Unauthorized Access</h1>} />
        <Route path="*" element={<h1>Page Not Found</h1>} />
        <Route path="/profile" element={<Profile_pg/>}/>
      </Routes>
    </BrowserRouter>
  );
};
export default App;