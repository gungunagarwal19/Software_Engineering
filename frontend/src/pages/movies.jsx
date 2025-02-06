import React, { useEffect, useState } from "react";

const Movies = () => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/movies")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched movies:", data);
        setMovies(data);
      })
      .catch((err) => console.error("Error fetching movies:", err));
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    const totalStars = 5;
    const filledStars = Math.round(rating / 2);

    for (let i = 1; i <= totalStars; i++) {
      stars.push(
        <span key={i} className={`text-lg ${i <= filledStars ? "text-yellow-400" : "text-gray-500"}`}>
          &#9733;
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="p-6 bg-black text-white w-full min-h-screen">
      <div className="flex flex-wrap justify-center gap-6">
        {movies.map((movie, index) => (
          <div key={index} className="w-60 bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
            <div className="h-80">
              {movie.image ? (
                <a href="/cinema">
                  <img 
                    src={movie.image}
                    alt={movie.title}
                    className="object-cover w-1/2 h-1/2"
                  />
                </a>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-300">
                  {movie.title}
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col justify-between flex-grow">
              <h2 className="text-lg font-semibold text-white truncate">{movie.title}</h2>
              <p className="text-gray-400 text-sm">Release Date: {movie.year || "Unknown"}</p>
              <p className="text-gray-400 text-sm">Rating: {typeof movie.rating === "number" ? movie.rating.toFixed(1) : "N/A"}</p>
              <div className="flex mt-2">{renderStars(movie.rating || 0)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Movies;
