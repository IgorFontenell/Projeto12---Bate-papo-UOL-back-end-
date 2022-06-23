import express from 'express';
import cors from "cors";

const server = express();
server.use(cors());

server.get("/", (request, response) => {
    response.send("Hello World");
});











server.listen(5000);