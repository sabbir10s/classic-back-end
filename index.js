const express = require('express');
const cors = require('cors');
const res = require('express/lib/response');
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
require('dotenv').config()
const bcrypt = require('bcrypt');
app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xghhlxf.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function authenticateToken(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    jwt.verify(token, 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Forbidden - Invalid token' });
        }
        req.user = user;

        next();
    });
}

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
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product);
        })

        //Add to cart
        app.post("/cart/:email", async (req, res) => {
            const email = req.params.email;
            const { product, quantity, size, color } = req.body;


            try {
                const user = await userCollection.findOne({ email });
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                if (!user.cart) {
                    user.cart = [];
                }
                const existingProduct = user.cart.find(item => item.color === color && item.size === size);
                console.log(existingProduct);
                if (existingProduct) {
                    existingProduct.quantity += quantity;
                } else {
                    user.cart.push({ product, quantity, size, color });
                }
                await userCollection.updateOne({ email }, { $set: { cart: user.cart } });

                res.status(200).json({ message: 'Product added to cart successfully', cart: user.cart });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        //Get cart item
        app.get("/cart/:email", async (req, res) => {
            const email = req.params.email;

            try {
                const user = await userCollection.findOne({ email });

                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                const cartItems = user.cart || [];

                res.status(200).json({ cart: cartItems });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });


        // get user
        app.get('/user', authenticateToken, (req, res) => {
            res.json(req.user);
        });

        function authenticateToken(req, res, next) {
            const token = req.headers.authorization;

            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            jwt.verify(token, 'secret-key', (err, user) => {
                if (err) {
                    return res.status(403).json({ error: 'Forbidden' });
                }

                req.user = user;
                next();
            });
        }

        // Register user
        app.post('/register', async (req, res) => {
            try {
                const { username, email, password } = req.body;

                // Check if the username already exists
                const existingUser = await userCollection.findOne({ email });
                if (existingUser) {
                    return res.status(400).send('user already exists');
                }
                const hashedPassword = await bcrypt.hash(password, 10);

                const newUser = {
                    username,
                    email,
                    password: hashedPassword,
                };
                const result = await userCollection.insertOne(newUser);
                const token = jwt.sign({ email: newUser.email, name: newUser.username }, 'secret-key');
                res.status(200).json({ token, insertedId: result.insertedId });
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });

        // Login user
        app.post("/login", async (req, res) => {
            const { email, password } = req.body;

            try {
                const user = await userCollection.findOne({ email });

                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                const passwordMatch = await bcrypt.compare(password, user.password);
                if (passwordMatch) {
                    const token = jwt.sign({ email: user.email, name: user.username }, 'secret-key');
                    res.status(200).json({ token, message: 'Login successful' });
                } else {
                    res.status(401).json({ error: 'Incorrect password' });
                }
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
