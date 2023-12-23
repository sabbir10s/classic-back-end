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

        // Get all product
        app.get("/products", async (req, res) => {
            const products = await productCollection.find().toArray();
            res.send(products);
        })

        // get single product
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product);
        })

        // Create user 
        app.post("/register", async (req, res) => {
            const { username, email, password } = req.body;

            try {
                const existingUser = await userCollection.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                const hashedPassword = await bcrypt.hash(password, 10);
                const newUser = {
                    username,
                    email,
                    password: hashedPassword,
                    login: true
                };
                const result = await userCollection.insertOne(newUser);
                res.status(200).json({ message: 'User registered successfully', insertedId: result.insertedId });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // Login
        app.post("/login", async (req, res) => {
            const { email, password } = req.body;

            try {
                const user = await userCollection.findOne({ email });

                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                const passwordMatch = await bcrypt.compare(password, user.password);
                if (passwordMatch) {
                    const currentTime = new Date();
                    await userCollection.updateOne(
                        { email },
                        {
                            $set: {
                                login: true,
                                lastLogin: currentTime,
                            },
                        }
                    );

                    // Send back additional information if needed
                    res.status(200).json({ message: 'Login successful', loggedIn: true, lastLogin: currentTime });
                } else {
                    res.status(401).json({ error: 'Incorrect password' });
                }
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });


        // Logout
        app.post("/logout/:email", async (req, res) => {
            const { email } = req.body;

            try {
                const user = await userCollection.findOne({ email });
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                await userCollection.updateOne({ email }, { $set: { login: false } });

                res.status(200).json({ message: 'Logout successful', login: false });
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
