import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { getDistance } from 'geolib';
import { connectDb } from './lib/db.js';
import dotenv from "dotenv";
import authRouter from './routes/authRoutes.js';  // Update path as per your project structure

dotenv.config();
const traktApiKey = process.env.TRAKT_API_KEY;
const fanartApiKey = process.env.FANART_API_KEY;

const traktBaseUrl = 'https://api.trakt.tv/movies';
const fanartBaseUrl = 'https://webservice.fanart.tv/v3/movies';


const overpassBaseUrl = 'https://overpass-api.de/api/interpreter';
const nominatimBaseUrl = "https://nominatim.openstreetmap.org/search";

const app = express();
app.use(cors({
    origin: "http://localhost:5173", credentials: true, methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
}));
app.use(express.json());

const pool = await connectDb();

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
        while (true) {
            const response = await axios.get(`${traktBaseUrl}/trending`, {
                headers: {
                    "Content-Type": "application/json",
                    "trakt-api-version": "2",
                    "trakt-api-key": traktApiKey
                },
                params: { page, limit: pageSize }
            });

            if (!response.data.length) break; // Stop if no more movies

            const filteredMovies = response.data.filter(movie => movie.movie.year && (movie.movie.year >= lastYear));


            console.log(`Movies fetched on page ${page}:`, filteredMovies.length);

            if (!filteredMovies.length) break;

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
                        const fanartResponse = await axios.get(`${fanartBaseUrl}/${movie.movie.ids.imdb}`, { params: { api_key: fanartApiKey } });
                        imageUrl = fanartResponse.data?.movieposter?.[0]?.url || null;
                    } catch (error) { console.error(`Image error for ${movie.movie.title}:`, error.message); }

                    try {
                        const ratingResponse = await axios.get(`${traktBaseUrl}/${movie.movie.ids.slug}/ratings`, {
                            headers: {
                                "Content-Type": "application/json",
                                "trakt-api-version": "2",
                                "trakt-api-key": traktApiKey
                            }
                        });
                        rating = ratingResponse.data.rating || "N/A";
                    } catch (error) { console.error(`Rating error for ${movie.movie.title}:`, error.message); }
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











app.post("/ticketsdetail", async (req, res) => {
    const { movie, theater, seats, date, time, price, user_id } = req.body;
    console.log(movie, theater, seats, date, time, price, user_id);

    try {
        await pool.execute(
            "INSERT INTO tickets (movie, theater, seats, date, time, price, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [movie, theater, JSON.stringify(seats), date, time, price, user_id]
        );

        res.json({ message: "Ticket saved successfully" });
    } catch (error) {
        console.error("Error saving ticket:", error);
        res.status(500).json({ message: "Database error" });
    }
});

// Fetch all tickets with user information
app.get("/tickets", async (req, res) => {
    try {
        const [tickets] = await pool.execute(`
            SELECT t.*, u.Name as user_name, u.Email as user_email 
            FROM tickets t 
            JOIN users u ON t.user_id = u.id 
            ORDER BY t.created_at DESC
        `);
        res.json(tickets);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({ message: "Database error" });
    }
});

// Get tickets for a specific user
app.get("/tickets/user/:userId", async (req, res) => {
    try {
        const [tickets] = await pool.execute(`
            SELECT t.*, u.Name as user_name, u.Email as user_email 
            FROM tickets t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.user_id = ? 
            ORDER BY t.created_at DESC
        `, [req.params.userId]);
        
        res.json(tickets);
    } catch (error) {
        console.error("Error fetching user tickets:", error);
        res.status(500).json({ message: "Database error" });
    }
});

app.post('/select-seat', async (req, res) => {
    const { seatId } = req.body;
    try {
        // Check if the seat is already booked
        const [seat] = await pool.execute("SELECT booked FROM seats WHERE id = ?", [seatId]);

        if (seat.length > 0 && seat[0].booked) {
            return res.status(400).json({ available: false, message: "Seat already booked" });
        }

        // Book the seat
        await pool.execute("UPDATE seats SET booked = TRUE WHERE id = ?", [seatId]);

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
        let { place, latitude, longitude } = req.body;

        if (!place && (!latitude || !longitude)) {
            console.log("No place or coordinates provided");
            return res.status(400).json({ message: "Please provide a location name or GPS coordinates" });
        }

        // Convert place to lat/lon if provided
        if (place) {
            console.log(`Fetching coordinates for place: ${place}`);
            const geoResponse = await axios.get(nominatimBaseUrl, {
                params: { q: place, format: "json", limit: 1 },
            });

            if (!geoResponse.data.length) {
                console.log("Location not found");
                return res.status(404).json({ message: "Location not found" });
            }

            latitude = parseFloat(geoResponse.data[0].lat);
            longitude = parseFloat(geoResponse.data[0].lon);
            console.log(`Resolved coordinates: Lat=${latitude}, Lon=${longitude}`);
        }

        console.log(`Searching cinemas near: Lat=${latitude}, Lon=${longitude}`);

        const radius = 10000; // 10 km range
        const overpassQuery = `
        [out:json];
        (
          node["amenity"="cinema"](around:${radius}, ${latitude}, ${longitude});
          way["amenity"="cinema"](around:${radius}, ${latitude}, ${longitude});
          relation["amenity"="cinema"](around:${radius}, ${latitude}, ${longitude});
        );
        out center;
        `;

        const overpassResponse = await axios.get(overpassBaseUrl, { params: { data: overpassQuery } });

        console.log("Overpass API raw response:", JSON.stringify(overpassResponse.data, null, 2));

        if (!overpassResponse.data.elements || overpassResponse.data.elements.length === 0) {
            console.log("No cinemas found nearby");
            return res.status(404).json({ message: "No cinemas found within 10 km" });
        }

        const cinemas = await Promise.all(
            overpassResponse.data.elements.map(async (cinema) => {
                let address = cinema.tags?.["addr:street"] || "Address not available";

                // Extract latitude and longitude correctly for both nodes and ways
                const lat = cinema.lat || cinema.center?.lat;
                const lon = cinema.lon || cinema.center?.lon;

                if (!lat || !lon) {
                    console.error(`Skipping cinema ${cinema.tags?.name || "Unknown Cinema"} due to missing coordinates.`);
                    return null; // Skip invalid entries
                }

                if (address === "Address not available") {
                    try {
                        const addressResponse = await axios.get("https://nominatim.openstreetmap.org/reverse", {
                            params: { lat, lon, format: "json" }
                        });
                        address = addressResponse.data.display_name || "Address not available";
                    } catch (error) {
                        console.error(`Error fetching address for ${cinema.tags?.name || "Unknown Cinema"}: ${error.message}`);
                    }
                }

                return {
                    name: cinema.tags?.name || "Unknown Cinema",
                    address,
                    distance: getDistance({ latitude, longitude }, { latitude: lat, longitude: lon }) / 1000
                };
            })
        );

        // Remove null values from the results
        const filteredCinemas = cinemas.filter(cinema => cinema !== null);

        // Sort cinemas by distance in ascending order
        filteredCinemas.sort((a, b) => a.distance - b.distance);

        console.log("Processed sorted cinema list:", JSON.stringify(filteredCinemas, null, 2));

        res.json({ cinemas: filteredCinemas, count: filteredCinemas.length });
    } catch (error) {
        console.error("Error fetching cinemas:", error.message);
        res.status(500).json({ message: "Failed to fetch cinemas" });
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
