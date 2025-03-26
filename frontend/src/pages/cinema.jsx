import React, { useState } from "react";
import { FaMapMarkerAlt, FaSearch, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import { MdLocationOn, MdMovie } from "react-icons/md";
import { useNavigate } from "react-router-dom";
const SearchCinemas = () => {
  const [location, setLocation] = useState("");
  const [cinemas, setCinemas] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useGps, setUseGps] = useState(false);
  const [searched, setSearched] = useState(false);
  const { movie, theater } = location.state || {};

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setCinemas([]);
    setCount(0);
    setSearched(true);

    try {
      if (useGps) {
        if (!navigator.geolocation) {
          setError("Geolocation is not supported by your browser.");
          setLoading(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const requestBody = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            await fetchCinemas(requestBody);
          },
          () => {
            setError("Unable to retrieve your location.");
            setLoading(false);
          }
        );
      } else {
        if (!location) {
          setError("Please enter a location.");
          setLoading(false);
          return;
        }
        await fetchCinemas({ place: location });
      }
    } catch (err) {
      setError("Failed to fetch cinemas. Try again.");
      setLoading(false);
    }
  };

  const fetchCinemas = async (body) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:3000/cinema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cinemas");
      }

      const data = await response.json();
      if (data.cinemas && data.cinemas.length > 0) {
        setCinemas(data.cinemas);
        setCount(data.cinemas.length);
      } else {
        setError("No cinemas found nearby.");
        setCinemas([]);
      }
    } catch (err) {
      setError("Failed to fetch cinemas. Try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleProceedToBooking = () => {
    navigate("/seat-booking", { state: { movie, theater } });
  };
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-full bg-cover bg-center text-white flex flex-col items-center justify-center p-6" style={{ backgroundImage: "url('image.png')" }}>
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="text-5xl font-bold mb-6 flex items-center">
          <MdMovie className="mr-3 text-yellow-400" /> Find Nearby Cinemas
        </h1>

        <div className="flex items-center space-x-2 bg-gray-800 bg-opacity-75 p-4 rounded-lg shadow-md">
          <input
            type="checkbox"
            checked={useGps}
            onChange={() => setUseGps(!useGps)}
            className="w-5 h-5 cursor-pointer"
          />
          <span className="text-lg flex items-center">
            <FaMapMarkerAlt className="mr-2 text-red-400" /> Use My Current Location
          </span>
        </div>

        {!useGps && (
          <div className="relative mt-4 w-96">
            <input
              type="text"
              placeholder="Enter city or place..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border border-gray-300 p-3 rounded-md w-full text-black shadow-md focus:ring-2 focus:ring-red-400"
            />
            <FaSearch className="absolute right-3 top-4 text-gray-500" />
          </div>
        )}

        <button
          onClick={handleSearch}
          className="mt-4 bg-red-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition shadow-lg"
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
          <span>Search</span>
        </button>

        {loading && <p className="mt-4 animate-pulse">Loading...</p>}
        {error && (
          <p className="mt-4 text-red-500 flex items-center">
            <FaExclamationTriangle className="mr-2" /> {error}
          </p>
        )}

        <div className="overflow-auto max-h-96 mt-6 w-full flex flex-col items-center px-4">
          {searched && count > 0 ? (
            <p className="font-semibold text-lg text-green-400">Found {count} cinema(s) nearby</p>
          ) : searched && cinemas.length === 0 && !loading && !error ? (
            <p className="text-gray-300">No cinemas found in this area.</p>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 w-full max-w-4xl">
            {cinemas.map((cinema, index) => (
            <div
            key={index}
            className="bg-gray-900 bg-opacity-80 rounded-lg p-4 shadow-lg cursor-pointer hover:bg-gray-800 transition"
            onClick={() => navigate("/seat")}
          >
            <h2 className="font-bold text-yellow-400 flex items-center">
              <MdMovie className="mr-2" /> {cinema.name}
            </h2>
            <p className="text-sm text-gray-300 flex items-center mt-1">
              <MdLocationOn className="mr-2 text-red-400" /> {cinema.address || "Address not available"}
            </p>
            <p className="text-sm text-gray-400">Distance: {cinema.distance} km</p>
          </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchCinemas;