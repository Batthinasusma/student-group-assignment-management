
const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
console.log("Database username:", process.env.DB_USER);

// Import PostgreSQL connection
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();
const groupRoutes = require("./routes/groupRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/assignments", assignmentRoutes);
console.log("GROUP ROUTES REGISTERED");

app.get("/", (req, res) => {
    res.send("Student Management API is running!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

