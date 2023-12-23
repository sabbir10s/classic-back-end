const express = require('express');
const cors = require('cors');
const res = require('express/lib/response');
const app = express();
const port = process.env.PORT || 5000;

require('dotenv').config()
const bcrypt = require('bcrypt');
app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xghhlxf.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        await client.connect();
        const productCollection = client.db("classicIt").collection("products");
        const userCollection = client.db("classicIt").collection("users");

        // Get single product
        app.get("/product", async (req, res) => {
            const products = await productCollection.find().toArray();
            res.send(products);
        })

        // Create user 
        app.post("/register", async (req, res) => {
            const { username, password } = req.body;

            try {
                // Check if the username is already taken
                const existingUser = await userCollection.findOne({ username });
                if (existingUser) {
                    return res.status(400).json({ error: 'Username already exists' });
                }

                // Hash the password before saving to the database
                const hashedPassword = await bcrypt.hash(password, 10);

                // Create a new user document
                const newUser = {
                    username,
                    password: hashedPassword,
                };

                // Insert the new user into the users collection
                const result = await userCollection.insertOne(newUser);

                // Return a success message
                res.status(200).json({ message: 'User registered successfully', insertedId: result.insertedId });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });


    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Server is running");
})
app.listen(port, () => {
    console.log("Server is running");
})
