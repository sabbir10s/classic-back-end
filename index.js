const express = require('express');
const cors = require('cors');
const res = require('express/lib/response');
const app = express();
const port = process.env.PORT || 5000;

require('dotenv').config()
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

        app.get("/product", async (req, res) => {
            const products = await productCollection.find().toArray();
            res.send(products);
        })

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
