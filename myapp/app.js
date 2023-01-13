const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;
app.use(express.json());

const initializeDBAndServer = async (request, response) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server has started");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const onlyParticularItem = (movie) => {
  return {
    movieName: movie.movie_name,
  };
};

app.get("/movies/", async (request, response) => {
  const allMoviesQuery = `
    SELECT * FROM movie`;
  const moviesList = await db.all(allMoviesQuery);
  response.send(moviesList.map((movie) => onlyParticularItem(movie)));
});

// creating a movie in list
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addMovieQuery = `INSERT INTO movie (director_id ,movie_name,lead_actor)
    VALUES ('${directorId}','${movieName}','${leadActor}');`;
  const addedMovie = await db.run(addMovieQuery);
  const movieId = addedMovie.lastID;
  response.send("Movie Successfully Added");
});

const stringFunc = (movie) => {
  return {
    movieId: movie.movie_id,
    directorId: movie.director_id,
    movieName: movie.movie_name,
    leadActor: movie.lead_actor,
  };
};

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `SELECT * FROM movie
    WHERE movie_id = '${movieId}';`;
  const movieDetails = await db.get(getMovieQuery);
  response.send(stringFunc(movieDetails));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateQuery = `UPDATE movie SET director_id = '${directorId}',
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
    WHERE movie_id ='${movieId}'`;
  const updatedMovie = await db.get(updateQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `
    DELETE FROM movie
    WHERE movie_id= '${movieId}'`;
  await db.get(deleteQuery);
  response.send("Movie Removed");
});

const outputEdit = (directors) => {
  return {
    directorId: directors.director_id,
    directorName: directors.director_name,
  };
};
//directors apis
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `SELECT * FROM director`;
  const directorsList = await db.all(getDirectorsQuery);
  response.send(directorsList.map((director) => outputEdit(director)));
});

//director movies

const directorMoviesList = (details) => {
  return {
    movieName: details.movie_name,
  };
};

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const moviesOfDirectorQuery = `SELECT * FROM movie 
    NATURAL JOIN director 
    WHERE director_id = '${directorId}'`;
  const directorMovies = await db.all(moviesOfDirectorQuery);
  response.send(directorMovies.map((movie) => directorMoviesList(movie)));
});

exports.app = app;
