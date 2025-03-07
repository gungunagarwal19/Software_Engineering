import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [value, setValue] = useState({
    Email: "",
    Password: "",
    role: "", // Default empty
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChanges = (e) => {
    setValue({ ...value, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    if (!value.Email || !value.Password || !value.role) {
      setError("All fields are required!");
      return;
    }
    try {
      const response = await axios.post("http://localhost:3000/auth/login", value);
      
      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("email", response.data.Email);
        localStorage.setItem("role", response.data.role);
  
        // Redirect based on role - match exactly as backend provides
        if (response.data.role === "User") {
          navigate("/movies");
        } else if (response.data.role === "Cinema Owner") {
          navigate("/cinema-dashboard");
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-black to-pink-500">
      <div className="shadow-lg px-8 py-5 border w-96 bg-gradient-to-tr from-gray-100 to-indigo-200 rounded-xl">
        <h2 className="text-lg font-bold mb-4 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter Email"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={value.Email}
              name="Email"
              onChange={handleChanges}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter Password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={value.Password}
              name="Password"
              onChange={handleChanges}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="role" className="block text-gray-700">
              Role
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={value.role}
              name="role"
              onChange={handleChanges}
            >
              <option value="">Select Role</option>
              <option value="User">User</option>
              <option value="Cinema Owner">Cinema Owner</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 mt-4 rounded-xl hover:bg-green-700 transition duration-300"
          >
            Submit
          </button>
        </form>
        {error && <p className="text-red-600 text-center mt-2">{error}</p>}
        <div className="text-center mt-2">
          <p>Don't have an account?</p>
          <Link to="/register" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
