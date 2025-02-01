import express from 'express';
import cors from 'cors';
import axios from 'axios';

const traktBaseUrl = 'https://api.trakt.tv/movies';
const fanartBaseUrl = 'https://webservice.fanart.tv/v3/movies';
const traktApiKey = '5f49d6f4a4fe874f7c43bca412a6956f7e9497ecbf18c18cc9700bea6f0a20c8';
const fanartApiKey = '2004d4c42bb45cdb35f593993a248beb';

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.get("/movies", async (req, res) => {
    try {
        // Fetch trending (recent) movies
        const traktResponse = await axios.get(`${traktBaseUrl}/trending`, {
            headers: {
                "Content-Type": "application/json",
                "trakt-api-version": "2",
                "trakt-api-key": traktApiKey
            }
        });

        const movies = traktResponse.data.map(item => item.movie);

        // Fetch images from Fanart API for each movie
        const moviesWithImages = await Promise.all(movies.map(async (movie) => {
            if (!movie.ids.imdb) return { ...movie, image: null };

            try {
                const fanartResponse = await axios.get(`${fanartBaseUrl}/${movie.ids.imdb}`, {
                    params: { api_key: fanartApiKey }
                });

                const images = fanartResponse.data?.movieposter;
                const imageUrl = images && images.length > 0 ? images[0].url : null;

                return { ...movie, image: imageUrl };
            } catch (error) {
                console.error(`Error fetching image for ${movie.title}:`, error);
                return { ...movie, image: null };
            }
        }));

        res.json(moviesWithImages);
    } catch (error) {
        console.error("Error fetching movies:", error);
        res.status(500).json({ message: "Failed to fetch movies" });
    }
});
app.get("/cinema",(req,res)=>{
    
})

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
