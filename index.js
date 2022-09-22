// SETUP EXPRESS
const express = require('express');
const cors = require('cors');
const mongodb = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const MongoClient = mongodb.MongoClient;
const dotenv = require('dotenv');
dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const YOUR_DOMAIN = process.env.DOMAIN;

let app = express();
app.use(express.json());
app.use(cors());

// connect to the Mongo DB
async function connect() {
    const mongo_url = process.env.MONGO_URI;
    let client = await MongoClient.connect(mongo_url, {
        "useUnifiedTopology": true
    })
    let db = client.db("dwad-ecommerce");
    console.log("database connected");
    return db;
}

// ROUTES
async function main() {
    let db = await connect();

    // this should be in the mongo database instead
    const products = [
        {
            _id: 1,
            name: "ACME Hammer",
            price: 100
        },
        {
            _id: 2,
            name: "ACME Anvil",
            price: 150
        },
        {
            _id: 3,
            name: "ACME Screwdriver",
            price: 125
        }
    ]

    app.get('/products', async (req, res) => {
        res.json(products);
    })

    app.post('/checkout', async (req, res) => {

        const lineItems = [];
        for (let item of req.body.items) {

            const product = products.find(p => p._id == item._id);

            lineItems.push({
                "quantity": item.quantity,
                "price_data": {
                    "product_data": {
                        "name": product.name,
                        "metadata": {
                            "_id": product._id
                        }
                    },
                    "unit_amount_decimal": product.price,
                    "currency": "SGD"
                },
            })
        }

        const stripeSession = await stripe.checkout.sessions.create({
            line_items: lineItems,
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/success`,
            cancel_url: `${YOUR_DOMAIN}/cancel`,
        });

        res.json({
            'session_id': stripeSession.id,
            'publishable_key': process.env.PUBLISHABLE_KEY
        })
    })


}


main();

// START SERVER
// note: we set port to 8888 so it won't clash with React
app.listen(8888, () => {
    console.log("server has started")
})