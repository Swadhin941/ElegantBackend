const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const jwt = require('jsonwebtoken');

//Middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wxzkvmx.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Un-authorize Access" });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            return res.status(401).send({ message: "Un-authorize Access" });
        }
        req.decoded = decoded;
        next();
    })

}

const forbiddenAccess = (req, res, next) => {
    if (req.decoded.email !== req.query.user) {
        return res.status(403).send({ message: "Forbidden Access" });
    }
    next();
}



const run = async () => {
    const Users = client.db("Elegant").collection("Users");

    try {

        app.post('/user', async (req, res) => {
            const userData = req.body;
            const checkEmailAvailability = await Users.findOne({ email: req.body.email });
            if (checkEmailAvailability) {
                return res.send({ acknowledged: true });
            }
            else {
                const result = await Users.insertOne(userData);
                return res.send(result);
            }
        });

        app.get('/user', verifyJWT, forbiddenAccess, async (req, res) => {
            const email = req.decoded.email;
            let getEmailInfo = await Users.findOne({ email });
            if (getEmailInfo) {
                return res.send(getEmailInfo);
            }
        });

        app.post('/jwt', (req, res) => {
            const email = req.body.email;
            const token = jwt.sign({ email }, ACCESS_TOKEN, { expiresIn: "5h" });
            res.send({ token });
        })

        app.put('/updateProfilePhoto', verifyJWT, forbiddenAccess, async (req, res) => {
            const photoURL = req.body.photoURL;
            const filter = { email: req.decoded.email };
            const updatedDoc = {
                $set: {
                    photoURL
                }
            }
            const option = { upsert: true };
            const result = await Users.updateOne(filter, updatedDoc, option);
            res.send(result);
        });

        app.put('/updateBio', verifyJWT, forbiddenAccess, async (req, res) => {
            const filter = { email: req.decoded.email };
            const updatedDoc = {
                $set: {
                    bio: req.body.bio
                }
            };
            const option = { upsert: true };
            const result = await Users.updateOne(filter, updatedDoc, option);
            res.send(result);
        })

        app.put('/updateCoverPhoto', verifyJWT, forbiddenAccess, async (req, res) => {
            const filter = { email: req.decoded.email };
            const updatedDoc = {
                $set: {
                    coverImg: req.body.coverImg,
                }
            };
            const option = { upsert: true };
            const result = await Users.updateOne(filter, updatedDoc, option);
            res.send(result);
        })


        app.get('/', (req, res) => {
            res.send("Elegant server work");
        })
    }
    finally {

    }


}

run()
    .catch(error => {
        console.log(error.message);
    })



app.listen(port, () => {
    console.log("Elegant Server");
})