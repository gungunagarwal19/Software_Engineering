import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { getDistance } from 'geolib';
import { connectDb } from './lib/db.js'; 
import dotenv from "dotenv";
import authRouter from './routes/authRoutes.js';  // Update path as per your project structure

dotenv.config();
const traktApiKey = process.env.TRAKT_API_KEY;

const traktBaseUrl = 'https://api.trakt.tv/movies';
const fanartBaseUrl = 'https://webservice.fanart.tv/v3/movies';

const fanartApiKey = '2004d4c42bb45cdb35f593993a248beb';
const overpassBaseUrl = 'https://overpass-api.de/api/interpreter';
const nominatimBaseUrl = "https://nominatim.openstreetmap.org/search";

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true , methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",}));
app.use(express.json());

connectDb(); 

// Routing
app.use('/auth', authRouter);

app.get("/", (req, res) => {
    return res.json('Welcome to the API!');
}); 

app.get("/movies", async (req, res) => {
    try {
        let allMovies = [];
        let page = 1;
        const pageSize = 25; // Maximum allowed limit
        let totalPages = 1;
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;

        // Fetch trending movies with pagination
        while (page <= totalPages) {
            const response = await axios.get(`${traktBaseUrl}/trending`, {
                headers: {
                    "Content-Type": "application/json",
                    "trakt-api-version": "2",
                    "trakt-api-key": traktApiKey
                },
                params: { page, limit: pageSize }
            });

            if (response.data.length === 0) break; // Stop if no more movies

            const filteredMovies = response.data.filter(movie => movie.movie.year && (movie.movie.year >= lastYear));

            console.log(`Movies fetched on page ${page}:`, filteredMovies.length);

            if (filteredMovies.length === 0) break;

            allMovies = allMovies.concat(filteredMovies);
            page++;

            // Uncomment if you want to enable pagination from headers
            // totalPages = parseInt(response.headers["x-pagination-page-count"], 10) || totalPages;
        }

        // Fetch images & ratings for each movie
        const moviesWithDetails = await Promise.all(
            allMovies.map(async (movie) => {
                let imageUrl = null;
                let rating = "N/A";

                if (movie.movie.ids.imdb) {
                    try {
                        // Fetch images from Fanart API
                        const fanartResponse = await axios.get(`${fanartBaseUrl}/${movie.movie.ids.imdb}`, {
                            params: { api_key: fanartApiKey }
                        });

                        const images = fanartResponse.data?.movieposter;
                        imageUrl = images && images.length > 0 ? images[0].url : null;
                    } catch (error) {
                        console.error(`Error fetching image for ${movie.movie.title}:`, error.message);
                    }

                    try {
                        // Fetch movie ratings from Trakt API
                        const ratingResponse = await axios.get(`${traktBaseUrl}/${movie.movie.ids.slug}/ratings`, {
                            headers: {
                                "Content-Type": "application/json",
                                "trakt-api-version": "2",
                                "trakt-api-key": traktApiKey
                            }
                        });

                        rating = ratingResponse.data.rating || "N/A";
                    } catch (error) {
                        console.error(`Error fetching rating for ${movie.movie.title}:`, error.message);
                    }
                }

                return {
                    title: movie.movie.title,
                    year: movie.movie.year,
                    ids: movie.movie.ids,
                    image: imageUrl,
                    rating
                };
            })
        );

        res.json(moviesWithDetails);
        
    } catch (error) {
        console.error("Error fetching movies:", error.message);
        res.status(500).json({ message: "Failed to fetch movies" });
    }
});







app.post('/select-seat', async (req, res) => {
    const { seatId } = req.body;
    try {
        // Check if the seat is already booked
        const [seat] = await db.execute("SELECT booked FROM seats WHERE id = ?", [seatId]);

        if (seat.length > 0 && seat[0].booked) {
            return res.status(400).json({ available: false, message: "Seat already booked" });
        }

        // Book the seat
        await db.execute("UPDATE seats SET booked = TRUE WHERE id = ?", [seatId]);

        // Return updated seat data
        res.json({ available: true, seatId, message: "Seat booked successfully" });
    } catch (error) {
        console.error("Error booking seat:", error);
        res.status(500).json({ message: "Error selecting seat" });
    }
});













// Fetch cinemas in a particular location

app.post("/cinema", async (req, res) => {
    try {
        const { place } = req.body;

        if (!place) {
            return res.status(400).json({ message: "Please provide a location name" });
        }

        // Get latitude and longitude using Nominatim
        const geoResponse = await axios.get(nominatimBaseUrl, {
            params: {
                q: place,
                format: "json",
                limit: 1,
            },
        });

        if (!geoResponse.data.length) {
            return res.status(404).json({ message: "Location not found" });
        }

        const { lat, lon } = geoResponse.data[0];

        // Construct Overpass query for cinemas
        const overpassQuery = `
        [out:json];
        node["amenity"="cinema"](around:5000,${lat},${lon});
        out body;
        `;

        // Send request to Overpass API
        const overpassResponse = await axios.post(overpassBaseUrl, `data=${overpassQuery}`);

        // Extract cinema data and calculate distances
        const cinemas = overpassResponse.data.elements.map((cinema) => {
            const distance = getDistance(
                { latitude: lat, longitude: lon }, // User's location
                { latitude: cinema.lat, longitude: cinema.lon } // Cinema's location
            );

            // Only include address if it's available
            const address = cinema.tags && cinema.tags["addr:street"] ? cinema.tags["addr:street"] : undefined;

            const cinemaData = {
                name: cinema.tags.name || "Unnamed Cinema",
                lat: cinema.lat,
                lon: cinema.lon,
                distance: distance / 1000, // Convert meters to kilometers
            };

            // Add address only if it's available
            if (address) {
                cinemaData.address = address;
            }

            return cinemaData;
        });

        // Sort cinemas by distance (ascending)
        cinemas.sort((a, b) => a.distance - b.distance);

        return res.json({ count: cinemas.length, cinemas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching cinema data" });
    }
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Handle unexpected errors
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
  });
  
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  });
  