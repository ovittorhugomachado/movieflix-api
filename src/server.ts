
import express from "express";
import { PrismaClient } from './generated/prisma/client'
import swaggerUi from "swagger-ui-express"
import swaggerDocument from "../swagger.json"

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

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
            where: { movie_name: { equals: movie_name, mode: "insensitive" } }
        });

        if (moviesWithSameName) {
            return res.status(409).send({ message: "Já existe um filme cadastrado com esse título" });
        };

        await prisma.movie.create({
            data: {
                movie_name,
                movie_language,
                genre_movie
            }
        });

        res.status(201).send()
    } catch (error: unknown) {
        res.status(500).json({
            message: "Não foi possível cadastrar o filme",
            error: error instanceof Error ? error.message : "Erro desconhecido"
        });
    }
});

app.put("/movies/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const movie = await prisma.movie.findUnique({
            where: { id: Number(id) },
        });

        if (!movie) {
            return res.status(404).json({ message: "Filme não encontrado" });
        }

        const data = req.body;

        const updatedMovie = await prisma.movie.update({
            where: { id: Number(id) },
            data,
        });

        res.status(200).json(updatedMovie);

    } catch (error: unknown) {
        res.status(500).json({
            message: "Falha ao atualizar o registro",
            error: error instanceof Error ? error.message : "Erro desconhecido"
        });
    }
});

app.delete("/movies/:id", async (req, res) => {

    const id = Number(req.params.id)

    try {
        const movie = await prisma.movie.findUnique({ where: { id } });

        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" })
        }

        await prisma.movie.delete({ where: { id } });

        res.status(200).send()

    } catch (error: unknown) {
        console.error(error);
        res.status(500).json({
            message: "Não foi possível deletar o filme",
            error: error instanceof Error ? error.message : "Erro desconhecido"
        });
    }
})

app.get("/movies/:genreName", async (req, res) => {

    try {
        const moviesFilteredByGenreName = await prisma.movie.findMany({
            include: {
                genres: true,
                languages: true
            },
            where: {
                genres: {
                    genre_name: {
                        equals: req.params.genreName,
                        mode: "insensitive"
                    }
                }
            }

        })

        res.status(200).send(moviesFilteredByGenreName)

    } catch (error: unknown) {
        res.status(500).json({
            message: "Erro ao filtrar filme por gênero",
            error: error instanceof Error ? error.message : "Erro desconhecido"
        });
    }

})

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});