import React, { useEffect, useState } from "react";

const TMDB_API_KEY = "2caefbacded25e3b9b0daeaf5294e326";  // Replace with your TMDb API key
const TMDB_API_URL = "https://api.themoviedb.org/3";
const NOW_PLAYING_ENDPOINT = "/movie/now_playing";

// TMDb base URL for images
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500/";

const Movies = () => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    // Fetch movies from TMDb's "now playing" endpoint
    fetch(`${TMDB_API_URL}${NOW_PLAYING_ENDPOINT}?api_key=${TMDB_API_KEY}&language=en-US&page=1`)
      .then((res) => res.json())
      .then((data) => setMovies(data.results)) // Store movie data
      .catch((err) => console.error("Error fetching movies:", err));
  }, []);

  // Function to render the rating stars based on vote_average
  const renderStars = (rating) => {
    const stars = [];
    const totalStars = 5;  // Total number of stars in the scale (1 to 5)
    const filledStars = Math.round((rating / 2));  // Scale TMDb's rating (0-10) to (0-5)

    for (let i = 1; i <= totalStars; i++) {
      if (i <= filledStars) {
        stars.push(<span key={i} className="text-yellow-400">&#9733;</span>); // Filled star
      } else {
        stars.push(<span key={i} className="text-gray-400">&#9733;</span>); // Empty star
      }
    }
    return stars;
  };

  return (
    <div className="p-6 bg-black text-white " >
     
      <div className="flex flex-wrap gap-9">
        {movies.map((movie, index) => (
          <div key={index} className="border rounded-lg shadow-lg w-60 h-[500px] flex flex-col border-none">
            {/* Movie Image */}
            <div className="flex-1">
              {movie.poster_path ? (
                <img
                  src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`}
                  alt={movie.title}
                  className="object-cover w-full h-full rounded-t-lg"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
                  No Image Available
                </div>
              )}
            </div>

            {/* Movie Description */}
            <div className="p-2 flex flex-col justify-between flex-1">
              <h2 className="text-lg font-semibold">{movie.title}</h2>
              <p className="text-gray-600">Release Date: {movie.release_date}</p>
              <p className="text-gray-600">Rating: {movie.vote_average}</p>

              {/* Display the star rating */}
              <div className="flex mt-2">{renderStars(movie.vote_average)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Movies;
