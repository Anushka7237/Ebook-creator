require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes=require('./routes/authRoutes');
const bookRoutes=require('./routes/bookRoutes');
const aiRoutes=require('./routes/aiRoutes');
const exportRoutes=require('./routes/exportRoutes');


const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ebook-creator-kappa.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
//Connect Database
connectDB();

//Middlewares
app.use(express.json());

//Static folder for uploads
app.use("/backend/uploads", express.static(path.join(__dirname, "uploads")));

//Routes Here
app.use("/auth",authRoutes);
app.use("/books",bookRoutes);
app.use("/ai",aiRoutes);
app.use("/export",exportRoutes);


//Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
