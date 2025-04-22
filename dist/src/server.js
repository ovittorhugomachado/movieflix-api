"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("./generated/prisma");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_json_1 = __importDefault(require("../swagger.json"));
const port = 3000;
const app = (0, express_1.default)();
const prisma = new prisma_1.PrismaClient();
app.use(express_1.default.json());
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
app.get("/movies", async (_, res) => {
    const movies = await prisma.movies.findMany({
        orderBy: { movie_name: 'asc' },
        include: { genres: true, languages: true }
    });
    res.json(movies);
});
app.post("/movies", async (req, res) => {
    const { movie_name, movie_language, genre_movie } = req.body;
    const moviesWithSameName = await prisma.movies.findFirst({
        where: { movie_name: { equals: movie_name, mode: "insensitive" } }
    });
    if (moviesWithSameName) {
        return res.status(409).send({ message: "Já existe um filme cadastrado com esse título" });
    }
    ;
    try {
        await prisma.movies.create({
            data: {
                movie_name: movie_name,
                movie_language: movie_language,
                genre_movie: genre_movie
            }
        });
    }
    catch (error) {
        return res.status(500).send({ message: "falha ao cadastrar filme" });
    }
    res.status(201).send();
});
app.put("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
        const movie = await prisma.movies.findUnique({ where: { id } });
        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" });
        }
        const data = { ...req.body };
        await prisma.movies.update({ where: { id }, data });
    }
    catch (error) {
        return res.status(500).send({ message: "Falha ao atualizar o registro" });
    }
    res.status(200).send();
});
app.delete("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
        const movie = await prisma.movies.findUnique({ where: { id } });
        if (!movie) {
            return res.status(404).send({ message: " Filme não encontrado" });
        }
        await prisma.movies.delete({ where: { id } });
    }
    catch (error) {
        return res.status(500).send({ message: "Erro ao remover filme" });
    }
    res.status(200).send();
});
app.get("/movies/:genreName", async (req, res) => {
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
        });
        res.status(200).send(moviesFilteresByGenreName);
    }
    catch (error) {
        return res.status(500).send({ message: "Erro ao filtrar filme por gênero" });
    }
});
app.listen(port, () => {
    console.log(`Servidor em execução em http://localhost:${port}`);
});
