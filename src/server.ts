import express from "express";
import { PrismaClient } from "./generated/prisma";
import swaggerUi from "swagger-ui-express"
import swaggerDocument from "../swagger.json"

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json())

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument)); 

app.get("/movies", async (_, res) => {

    const movies = await prisma.movies.findMany({
        orderBy: { movie_name: 'asc' },
        include: { genres: true, languages: true }
    })

    res.json(movies);
});

app.post("/movies", async (req, res): Promise<void> => {

    const { movie_name, movie_language, genre_movie } = req.body

    const moviesWithSameName = await prisma.movies.findFirst({
        where: { movie_name: { equals: movie_name, mode: "insensitive" } }
    });

    if (moviesWithSameName) {
        return res.status(409).send({ message: "Já existe um filme cadastrado com esse título" }) as any;
    };

    try {
        await prisma.movies.create({
            data: {
                movie_name: movie_name,
                movie_language: movie_language,
                genre_movie: genre_movie
            }
        });
    } catch (error) {
        return res.status(500).send({ message: "falha ao cadastrar filme" }) as any;
    }

    res.status(201).send();
})

app.put("/movies/:id", async (req, res): Promise<void> => {

    const id = Number(req.params.id)

    try {
        const movie = await prisma.movies.findUnique({ where: { id } });

        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" }) as any;
        }

        const data = { ...req.body }

        await prisma.movies.update({ where: { id }, data });
    } catch (error) {
        return res.status(500).send({ message: "Falha ao atualizar o registro" }) as any;
    }

    res.status(200).send();
});

app.delete("/movies/:id", async (req, res): Promise<void> => {

    const id = Number(req.params.id);

    try {
        const movie = await prisma.movies.findUnique({ where: { id } })

        if (!movie) {
            return res.status(404).send({ message: " Filme não encontrado" }) as any;
        }

        await prisma.movies.delete({ where: { id } })
    } catch (error) {
        return res.status(500).send({ message: "Erro ao remover filme" }) as any;
    }

    res.status(200).send();
})

app.get("/movies/:genreName", async (req, res): Promise<void> => {

    try {
        const moviesFilteresByGenreName = await prisma.movies.findMany({
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
        res.status(200).send(moviesFilteresByGenreName)

    } catch (error) {
        return res.status(500).send({message: "Erro ao filtrar filme por gênero"}) as any;
    }
})


app.listen(port, () => {
    console.log(`Servidor em execução em http://localhost:${port}`);
});