import express from "express"
import { PrismaClient } from './generated/prisma/client'

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json())

app.get("/movies", async (_, res) => {

    const movies = await prisma.movie.findMany({
        orderBy: {
            movie_name: "asc"
        },
        include: {
            genres: true,
            languages: true
        }
    });

    res.json(movies);
});

app.post("/movies", async (req, res) => {
    const { movie_name, movie_language, genre_movie } = req.body

    try {
        const moviesWithSameName = await prisma.movie.findFirst({
            where: { movie_name: {equals: movie_name, mode: "insensitive"} }
        });

        if (moviesWithSameName) {
            return res.status(409).send({ message: "Jáexiste um filme cadastrado com esse título" });
        };

        await prisma.movie.create({
            data: {
                movie_name,
                movie_language,
                genre_movie
            }
        });
    } catch (error) {
        return res.status(500).send({ message: "ocorreu um erro ao cadastrar filme" });
    }

    res.status(201).send()
})

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});