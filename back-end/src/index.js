import express from 'express';
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import joi from 'joi';

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
        DB = client.db("BatePapoUol"); 
        }); // Conecting the server with the BatePapoUol database in the mongo.
    DB.collection("users").find().toArray().then(promise => {
        users = promise;
    }); // Creating the varible that stocks our users names.
    DB.collection("messages").find().toArray().then(promise => {
        messages = promise;
    }); // Creating the variable that stocks our users messages.
}
gettingMongoData();

// Function that looks for all the users that are inative for more than 10s. It will delete then and send a message of status "User left the room". 
function verifyingStatus () {
    let atualTime = Date.now();
    users.map(async object => {
        if(atualTime - object.lastStatus >= 10000) {
            await DB.collection("users").deleteOne({name: object.name});
            await DB.collection("messages").insertOne({
                from: object.name,
                to: "Todos",
                text: "sai da sala...",
                type: "status",
                time: dayjs().format("HH:mm:ss")
            });
        }
    });
    DB.collection("users").find().toArray().then(promise => {
        users = promise;
    });
    DB.collection("messages").find().toArray().then(promise => {
        messages = promise;
    });
}
setInterval(verifyingStatus, 1000);
setInterval(verifyingStatus, 15000);

function updateUsers(user) {
    DB.collection("users").insertOne(user).then(() => {
        DB.collection("users").find().toArray().then(promise => {
            users = promise;
        });
     });
};

function updateMessages(message){
    DB.collection("messages").insertOne(message).then(() => {
        DB.collection("messages").find().toArray().then(promise => {
            messages = promise;
        });
     });
};
// Sending to the front-end all users available in the sistem.
 server.get("/participants", (request, response) => {
    DB.collection("users").find().toArray().then( promise => {
        response.send(promise);
    }); 
 }); 


 server.get("/messages", (request, response) => {
    let user = request.headers.user;
    const limit = parseInt(request.query.limit);
    let messagesVerification = messages.filter(object => object.to === "Todos" || object.to === user || object.from === user);
    let newMessages = messagesVerification.slice(-limit);
  
     
    response.send(newMessages);
 });

server.post("/participants", (request, response) => {
    const userSchema = joi.object({
        name: joi.string().required()
    });
    
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
    const validation = userSchema.validate(request.body);
    
    if(validation.error) {
        
        response.sendStatus(422);
        return;
    }

    let verifyName = users.find(object => object.name === request.body.name);
    if (verifyName) {
        response.sendStatus(409);
        return;
    }

    updateUsers(userInfo);
    updateMessages(userLogin); 
    
    response.sendStatus(201);
});
    

server.post ("/messages", async (request, response) => {
     users = await DB.collection("users").find().toArray();
     let userMessage = {
        from: request.headers.user,
        to: request.body.to,
        text: request.body.text,
        type: request.body.type,
        time: dayjs().format('HH:mm:ss')
    }
    const messageSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required()
    });
    const validation = messageSchema.validate(request.body);
    
    if(validation.error) {
        response.sendStatus(422);
        return;
    };
    let nameVerify = users.find(object => object.name === request.headers.user);

    if(!nameVerify) {
        response.sendStatus(422);
        return
    };
    if(request.body.type === "private_message" || request.body.type === "message") {
        updateMessages(userMessage);
        return;
    };
    response.sendStatus(422);
});

server.post("/status", async (request, response) => {
    let user = request.headers.user;
    let nameVerify = users.find(object => object.name === user);
    if(!nameVerify) {
        response.sendStatus(404);
        return;
    }
    await DB.collection("users").updateOne({name: user},{$set:{lastStatus: Date.now()}});
    await DB.collection("users").find().toArray().then(promise => {
        users = promise
    });
    response.sendStatus(200);
});



server.listen(5000);