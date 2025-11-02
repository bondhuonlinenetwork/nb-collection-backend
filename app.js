const fs = require("fs");
const express = require("express");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();
const path = require("path");
app.use(cors({
    origin: [
        'http://localhost:5173', // for local dev
        'https://nb-collection-backend-vercel.vercel.app/', // your deployed frontend
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(cookieParser());
app.use(express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 10000 }));
app.use(express.json({ limit: '10mb', parameterLimit: 10000 }));
app.use(express.static("public"));
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

const router = require("./router");
app.use("/", router);
const MONGO_URI = "mongodb+srv://princeislam:V5fhdiQ94mtahJfY@cluster0.65efyvj.mongodb.net/prince"
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));

app.get("/", (req, res) => {
    res.send("server working successfully.");
});

app.get(/.*/, (req, res) => {
    res.send("<h1>404 NOT FOUND</h1>");
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`server is running on ${port}`);
});