import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Home = () => {
  console.log("Home component rendered");
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/auth/home", {
        headers: { "Authorization": `Bearer ${token}` }, // Changed from "Authorisation"
      });
      if (response.status !== 200) { // Changed from 201 to match backend success status
        navigate("/login");
      }
      console.log(response);
    } catch (error) {
      console.log(error);
      navigate("/login"); // Always navigate to login on error
    }
  };
  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black to-pink-500 text-white p-6">
      {/* Hero Section */}
      <h1 className="text-5xl font-extrabold drop-shadow-lg mb-4">
        Welcome to <span className="text-yellow-300">CineVibe</span>
      </h1>
      <p className="text-lg text-center max-w-2xl font-medium opacity-90">
       Ek Movie ho jae..
      </p>

      {/* Buttons Section */}
      <div className="mt-6 flex space-x-4">
        <Link
          to="/login"
          className="text-lg font-semibold underline hover:text-yellow-300 transition-all"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="text-lg font-semibold underline hover:text-yellow-300 transition-all"
        >
          Register
        </Link>
      </div>
    </div>
  );
};

export default Home;
