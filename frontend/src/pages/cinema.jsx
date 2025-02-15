import React, { useState } from "react";

const SearchCinemas = () => {
  const [location, setLocation] = useState("");
  const [cinemas, setCinemas] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    setCinemas([]);

    try {
      const response = await fetch("http://localhost:3000/cinema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place: location }),
      });

      const data = await response.json();

      if (response.ok) {
        setCinemas(data.cinemas);
        setCount(data.count);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch cinemas. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[url('image.png')] bg-cover bg-center h-screen w-full text-white overflow-hidden">
      <div className="flex flex-col items-center p-6">
        <h1 className="text-5xl font-bold mb-9">Search Cinemas</h1>
        <input
          type="text"
          placeholder="Enter location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border p-2 rounded-md w-80 text-black"
        />
        <button
          onClick={handleSearch}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Search
        </button>

        {loading && <p className="mt-4">Loading...</p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}

        <div className="overflow-auto max-h-96 mt-4 scrollbar-hidden "> 
          {count > 0 && (
            <p className="font-semibold">Found {count} cinema(s) near {location}</p>
          )}
          <a href="/seat">
          <ul className="mt-4 w-80">
            {cinemas.map((cinema, index) => (
              <li key={index} className="border-b p-2">
                <strong>{cinema.name}</strong>
                <br />
                <span className="text-sm text-gray-600">
                  {cinema.address || "Address not available"}
                </span>
                <br />
                <span className="text-sm text-gray-400">
                  Distance: {cinema.distance.toFixed(2)} km
                </span>
              </li>
            ))}
          </ul>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SearchCinemas;
