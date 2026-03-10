const express = require("express"); // Express framework for building the server
const axios = require("axios"); // Axios library for making HTTP requests to external APIs

const app = express(); // Create an instance of the Express application

app.use(express.json()); // Middleware to parse JSON request bodies

const PORT = 5000; // Port number on which the server will listen for incoming requests

let movies = []; // Initialize an empty array to store movie data that will be loaded from the Private API

async function loadMovies() { // Asynchronous function to load movies from the Private API
  try {
    const tokenResponse = await axios.post("https://t4e-demotestserver.onrender.com/api/public/token", // Make a POST request to the token endpoint of the Public API to obtain an authentication token
      {
        studentId: "E0223006", // Unique ID 
        set: "setA", // SET Mentioned in your email
        // password : "password123" password if mentioned in the email, else ignore
       }
    );
    const token = tokenResponse.data.token; // Extract the token from the response data received from the Public API
    console.log("Token received:", token); // Log the received token to the console for debugging purposes
    console.log("Token received:", tokenResponse.data.dataUrl); // Log the data URL received from the Public API to the console for debugging purposes
    const dataResponse = await axios.get("https://t4e-demotestserver.onrender.com/api/private/setA", // Make a GET request to the private API endpoint to retrieve movie data
      {
        headers: 
        {
          Authorization: `Bearer ${token}` // Include the obtained token in the Authorization header of the request to authenticate with the Private API
        }
      }
    );
    console.log("Movies loaded:", dataResponse.data); // Log the entire response data received from the Private API to the console for debugging purposes
    movies = dataResponse.data.data.movies; // Extract the movies array from the response data and store it in the movies variable for later use in the API endpoints
    // console.log("Movies loaded:", movies); // Log the loaded movies array to the console for debugging purposes to ensure that the data has been successfully retrieved and stored in the movies variable
  } 

  catch (error) // Catch any errors that occur during the token retrieval or movie data loading process and log them to the console for debugging purposes
  {
    if (error.response) {
      console.log("API error:", error.response.data);
    } 
    else {
      console.log(error.message);
    }

  }
}
// -------------------------------------------------------------------------
//  1. GET /movies - Returns a list of all movies along with the total count of movies
app.get("/movies", (req, res) => {
  res.json({
    totalMovies: movies.length,
    movies
  });
});
// -------------------------------------------------------------------------

//  2. GET /movies/:id - Returns a specific movie by its ID
app.get("/movies/:id", (req, res) => {
  const movie = movies.find(m => m.id === req.params.id);

  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  res.json(movie);
});
// -------------------------------------------------------------------------

// 3. GET /movies/search?genre=GENRE - Returns a list of movies that belong to a specific genre provided as a query parameter
app.get("/movies/search", (req, res) => {
  const genre = req.query.genre;
  const result = movies.filter(m =>
    m.genre.includes(genre)
  );
  res.json(result);
});
// -------------------------------------------------------------------------

// 4. GET /movies/count - Returns the total number of movies available in the dataset
app.get("/movies/count", (req, res) => {
  res.json({
    totalMovies: movies.length
  });
});
// -------------------------------------------------------------------------

// 5. GET /movies/genres - Returns a list of all unique genres present in the movie dataset
app.get("/movies/genres", (req, res) => {
  const genres = [...new Set(movies.flatMap(m => m.genre))];

  res.json({ genres });
});

// 6. GET /movies/multi-genre - Returns a list of movies that belong to more than one genre
app.get("/movies/multi-genre", (req, res) => {
  const result = movies.filter(m => m.genre.length > 1);
  res.json(result);
});
// -------------------------------------------------------------------------

// 7. GET /movies/genre/count - Returns a count of how many movies belong to each genre in the dataset 
app.get("/movies/genre/count", (req, res) => {
  const counts = {};
  movies.forEach(movie => {
    movie.genre.forEach(g => {
      counts[g] = (counts[g] || 0) + 1;
    });
  });
  res.json(counts);
});
// -------------------------------------------------------------------------

// 8. GET /movies/genre/first - Returns the first movie found for each genre in the dataset
app.get("/movies/genre/first", (req, res) => {
  const result = {};

  movies.forEach(movie => {
    movie.genre.forEach(g => {
      if (!result[g]) {
        result[g] = movie.name;
      }
    });
  });
  res.json(result);
});
// -------------------------------------------------------------------------

// 9. GET /movies/genre/popular - Returns the most popular genre based on the number of movies that belong to that genre in the dataset
app.get("/movies/genre/popular", (req, res) => {
  const counts = {};
  movies.forEach(movie => {
    movie.genre.forEach(g => {
      counts[g] = (counts[g] || 0) + 1;
    });
  });
  let maxGenre = null;
  let maxCount = 0;
  for (const g in counts) {
    if (counts[g] > maxCount) {
      maxGenre = g;
      maxCount = counts[g];
    }
  }
  res.json({
    genre: maxGenre,
    count: maxCount
  });
});
// -------------------------------------------------------------------------

// 10. GET /movies/genre/:genre/count - Returns the count of movies that belong to a specific genre provided as a URL parameter
app.get("/movies/genre/:genre/count", (req, res) => {
  const genre = req.params.genre.toLowerCase();
  const count = movies.filter(m =>
    m.genre.some(g => g.toLowerCase() === genre)
  ).length;
  if (count === 0) {
    return res.json({ message: "No movies found for this genre" });
  }
  res.json({
    genre,
    count
  });
});
// -------------------------------------------------------------------------

// Start the server by first loading the movies from the Private API and then listening for incoming requests on the specified port
async function start() {
  await loadMovies();
  app.listen(PORT, () => {
    console.log("Server running on port", `http://localhost:${PORT}`);
  });
}
start(); // Call the start function to initialize the server and load the movie data before accepting incoming requests