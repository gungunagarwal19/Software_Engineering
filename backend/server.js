import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { getDistance } from 'geolib';
import { connectDb } from './lib/db.js';
import dotenv from "dotenv";
import authRouter from './routes/authRoutes.js';  // Update path as per your project structure
import nodemailer from 'nodemailer';

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

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'testshuklaweb@gmail.com',
        pass: 'eeft hdwe vglc sjdg'
    },
});

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
                        // console.log("Fanart API Key:", fanartApiKey);
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
        // Check for duplicate tickets
        const [existingTickets] = await pool.execute(`
            SELECT id FROM tickets 
            WHERE movie = ? 
            AND theater = ? 
            AND date = ? 
            AND time = ? 
            AND JSON_CONTAINS(seats, ?)
        `, [movie, theater, date, time, JSON.stringify(seats)]);

        if (existingTickets.length > 0) {
            return res.status(400).json({ 
                message: "These seats are already booked for this show" 
            });
        }

        // Get the user's email from the database
        const [userRows] = await pool.execute(
            "SELECT Email FROM users WHERE id = ?",
            [user_id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userEmail = userRows[0].Email;

        // Insert ticket into database first (without QR code)
        const [result] = await pool.execute(
            "INSERT INTO tickets (movie, theater, seats, date, time, price, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [movie, theater, JSON.stringify(seats), date, time, price, user_id]
        );

        const ticketId = result.insertId;

        // Generate QR code using the Python API
        let qrCodeBase64 = null;
        let qrUuid = null;
        try {
            // Add a descriptive title to the ticket for better identification
            const ticketTitle = `${movie} - ${date} ${time}`;

            const qrResponse = await axios.post("http://localhost:3002/generate-qr", {
                movie,
                theater,
                seats,
                date,
                time,
                price,
                ticket_id: ticketId.toString(),
                user_id: user_id.toString(),
                timestamp: new Date().toISOString(),
                // Add a title field for better identification
                title: ticketTitle
            });

            qrCodeBase64 = qrResponse.data.qr_code;
            qrUuid = qrResponse.data.ticket_data.qr_uuid;

            console.log("Successfully generated QR code with UUID:", qrUuid);

            // Try to update the ticket with QR code if the columns exist
            try {
                await pool.execute(
                    "UPDATE tickets SET qr_code = ?, qr_uuid = ? WHERE id = ?",
                    [qrCodeBase64, qrUuid, ticketId]
                );
            } catch (dbError) {
                // If columns don't exist, log the error but continue
                console.log("Could not save QR code to database. The columns might not exist:", dbError.message);
            }
        } catch (qrError) {
            console.error("Error generating QR code:", qrError.message);
            // Continue even if QR code generation fails
        }

        // No need for a second attempt at QR code generation

        // Send email to user with only ticket information
        const mailOptions = {
            from: 'testshuklaweb@gmail.com',
            to: userEmail,
            subject: 'Your Movie Ticket Booking Confirmation',
            html: `
                <h1>Ticket Booking Confirmation</h1>
                <p>Thank you for booking with us! Here are your ticket details:</p>
                <ul>
                    <li><strong>Ticket #:</strong> ${ticketId}</li>
                    <li><strong>Movie:</strong> ${movie}</li>
                    <li><strong>Theater:</strong> ${theater}</li>
                    <li><strong>Seats:</strong> ${seats.join(', ')}</li>
                    <li><strong>Date:</strong> ${date}</li>
                    <li><strong>Time:</strong> ${time}</li>
                    <li><strong>Price:</strong> ₹${price}</li>
                </ul>
                ${qrCodeBase64 ? `
                <div style="text-align: center; margin: 15px 0;">
                    <img src="data:image/png;base64,${qrCodeBase64}" alt="Ticket QR Code" width="200" height="200">
                </div>` : ''}
                <p>Enjoy your movie!</p>
            `
        };

        // Send email
        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${userEmail}`);
        } catch (error) {
            console.error("Error sending email:", error);
            // Continue even if email sending fails
        }

        // Return the ticket ID and QR code to the frontend
        res.json({
            message: "Ticket saved successfully and confirmation email sent",
            ticket: {
                id: ticketId,
                movie,
                theater,
                seats,
                date,
                time,
                price,
                qr_uuid: qrUuid
            },
            qrCode: qrCodeBase64
        });
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

// Get tickets for a specific theater 
app.get("/tickets/theater/:theaterName", async (req, res) => {
    try {
        const [tickets] = await pool.execute(`
            SELECT t.*, u.Name as user_name, u.Email as user_email 
            FROM tickets t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.theater = ? 
            ORDER BY t.created_at DESC
        `, [req.params.theaterName]);
        
        res.json(tickets);
    } catch (error) {
        console.error("Error fetching theater tickets:", error);
        res.status(500).json({ message: "Database error" });
    }
});

// Get QR code for a specific ticket 
app.get("/ticket/:ticketId/qr", async (req, res) => {
    try {
        const ticketId = req.params.ticketId;

        // Get ticket details from database
        const [tickets] = await pool.execute(`
            SELECT t.*, u.Name as user_name, u.Email as user_email
            FROM tickets t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ?
        `, [ticketId]);

        if (tickets.length === 0) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        const ticket = tickets[0];
        const seats = JSON.parse(ticket.seats);

        // Generate QR code using the Python API
        try {
            const qrResponse = await axios.post("http://localhost:3002/generate-qr", {
                movie: ticket.movie,
                theater: ticket.theater,
                seats: seats,
                date: ticket.date,
                time: ticket.time,
                price: ticket.price,
                ticket_id: ticket.id.toString(),
                user_id: ticket.user_id.toString()
            });

            return res.json({
                ticket: {
                    id: ticket.id,
                    movie: ticket.movie,
                    theater: ticket.theater,
                    seats: seats,
                    date: ticket.date,
                    time: ticket.time,
                    price: ticket.price,
                    user_name: ticket.user_name,
                    user_email: ticket.user_email
                },
                qrCode: qrResponse.data.qr_code
            });
        } catch (qrError) {
            console.error("Error generating QR code:", qrError.message);
            return res.status(500).json({ message: "Error generating QR code" });
        }
    } catch (error) {
        console.error("Error fetching ticket QR code:", error);
        res.status(500).json({ message: "Database error" });
    }
});


app.post('/select-seat', async (req, res) => {
    const { seatId, theater } = req.body;
    try {
        // Check if the seat is already booked in the same theater
        const [existingBookings] = await pool.execute(`
            SELECT seats FROM tickets 
            WHERE theater = ? AND JSON_CONTAINS(seats, ?)
        `, [theater, JSON.stringify(seatId)]);

        if (existingBookings.length > 0) {
            return res.status(400).json({ 
                available: false, 
                message: "Seat already booked in this theater" 
            });
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

// Groot API endpoint
app.post("/api/groot/chat", async (req, res) => {
    try {
        const { message, userId } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        console.log(`Received chat request: "${message}" from user ${userId || 'unknown'}`);

        // Call the Groot API
        const response = await axios.post("http://localhost:3001/chat", {
            message,
            unrestricted: true
        }, {
            headers: {
                "Content-Type": "application/json",
                "x-api-key": "sk-groot-api-key-2024" // Use the API key from Groot's .env file
            }
        });

        console.log(`Groot API response:`, response.data);

        // If the response doesn't have the expected format, create a fallback response
        if (!response.data || !response.data.response) {
            console.warn("Unexpected response format from Groot API");
            return res.json({
                response: "I received your message, but I'm having trouble processing it right now. Could you try asking something else?",
                reference_used: false
            });
        }

        return res.json(response.data);
    } catch (error) {
        console.error("Error calling Groot API:", error.message);

        // Provide a fallback response that doesn't mention errors
        return res.json({
            response: "I'm here to help with information about movies, bookings, and CineVibe. What would you like to know?",
            reference_used: false
        });
    }
});

// Note: Groot API should be started separately
console.log('\x1b[33m%s\x1b[0m', 'IMPORTANT: The Groot API must be started separately on http://localhost:3001');
console.log('\x1b[33m%s\x1b[0m', 'Run: python -m uvicorn api:app --host 0.0.0.0 --port 3001 in the Groot directory');

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
