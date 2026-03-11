const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

let movies = [];

async function loadMovies() {
  try {
    const tokenResponse = await axios.post("https://t4e-demotestserver.onrender.com/api/public/token",
      {
        studentId: "E0223006",
        set: "setA"
        // password : "password123"
      }
    );

    const token = tokenResponse.data.token;
    console.log("Token received:", token);
    console.log("Token received:", tokenResponse.data.dataUrl);

    const dataResponse = await axios.get("https://t4e-demotestserver.onrender.com/api/private/setA",
      {
        headers:
        {
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log("Movies loaded:", dataResponse.data);
    movies = dataResponse.data.data.movies;
    console.log("Movies loaded:", movies.length);
  }

  catch (error)
  {
    if (error.response) {
      console.log("API error:", error.response.data);
    }
    else {
      console.log(error.message);
    }
  }
}

/* ============================= */
/* STATIC ENDPOINTS */
/* ============================= */

app.get("/movies", (req, res) => {
  res.json({
    totalMovies: movies.length,
    movies
  });
});

app.get("/movies/count", (req, res) => {
  res.json({
    totalMovies: movies.length
  });
});

/* ============================= */
/* QUERY ENDPOINT */
/* ============================= */

app.get("/movies/search", (req, res) => {
  const genre = req.query.genre;

  const result = movies.filter(m =>
    m.genre.includes(genre)
  );

  res.json(result);
});

/* ============================= */
/* DATA EXTRACTION ENDPOINTS */
/* ============================= */

app.get("/movies/genres", (req, res) => {
  const genres = [...new Set(movies.flatMap(m => m.genre))];

  res.json({ genres });
});

/* ============================= */
/* FILTERING ENDPOINT */
/* ============================= */

app.get("/movies/multi-genre", (req, res) => {
  const result = movies.filter(m => m.genre.length > 1);
  res.json(result);
});

/* ============================= */
/* GENRE ANALYTICS */
/* ============================= */

app.get("/movies/genre/count", (req, res) => {
  const counts = {};

  movies.forEach(movie => {
    movie.genre.forEach(g => {
      counts[g] = (counts[g] || 0) + 1;
    });
  });

  res.json(counts);
});

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

/* ============================= */
/* DYNAMIC ROUTE (ALWAYS LAST) */
/* ============================= */

app.get("/movies/:id", (req, res) => {
  const movie = movies.find(m => m.id === req.params.id);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }
  res.json(movie);
});

async function start() {
  await loadMovies();
  app.listen(PORT, () => {
    console.log("Server running on port", `http://localhost:${PORT}`); 
  });
}

start();