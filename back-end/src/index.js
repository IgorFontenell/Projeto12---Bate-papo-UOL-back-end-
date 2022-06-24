import express from 'express';
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";

const server = express(); // Creating the server
server.use(express.json()); // Making the server understand the JSON
server.use(cors()); // Giving permition to others CPU's gates comunicate with our app

dotenv.config(); // Starting the dotenv aplication
//const client = new MongoClient(process.env.URL_CONNECT_MONGO);
let DB;
let users;
let messages;
//Function that gets all of the mongo data even when the server runs slowly
async function gettingMongoData () {

    const client = new MongoClient("mongodb://127.0.0.1:27017"); // Creating the conection between our server and the mongo app.
    
    await client.connect().then(() => {
        DB = client.db("BatePapoUol"); // Conecting the server with the BatePapoUol database in the mongo.
        });
    DB.collection("users").find().toArray().then(promise => {
        users = promise;
    }); // Creating the varible that stocks our users names.
    DB.collection("messages").find().toArray().then(promise => {
        messages = promise;
    }); // Creating the variable that stocks our users messages.
}
gettingMongoData();

 server.get("/participants", (request, response) => {
    DB.collection("users").find().toArray().then( promise => {
        response.send(promise);
        console.log(promise);
    }); 
    
    // Verificar a forma que o front precisa desse dado, pq algo ta dando errado.
    
 })

server.post("/participants", (request, response) => {
    
    let userInfo = {
        name: request.body.name,
        lastStatus: Date.now()
    }
    let userLogin = {
        from: request.body.name,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: dayjs().format('HH:mm:ss')
    }
    if (request.body.name.length === 0) {
        response.sendStatus(422);
        return;
    }

    let verifyName = users.find(object => object.name === request.body.name);
    if (verifyName) {
        response.sendStatus(409);
        return;
    }
            
        

     DB.collection("users").insertOne(userInfo).then(() => {
        DB.collection("users").find().toArray().then(promise => {
            users = promise;
        });
     });
     DB.collection("messages").insertOne(userLogin).then(() => {
        DB.collection("messages").find().toArray().then(promise => {
            messages = promise;
        });
     });
    response.sendStatus(201);
});
    

server.post ("/messages", (request, response) => {
    users = DB.collection("users").find().toArray();
    if(request.body.to.length === 0 || request.body.text.length === 0) {
        response.sendStatus(422);
        return;
    }
    if(request.body.type !== "private_message" || request.body.type !== "message") {
        response.sendStatus(422);
        return;
    }
    console.log(request.headers.user);
    //if(request.headers.from)



});


server.listen(5000);