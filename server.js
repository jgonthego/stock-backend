require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
const PORT = 5000;

app.get("/", (req, res) => {
    res.send("Server is running! Try /api/trending-stocks");
});

// Fetch trending stocks with prices
app.get("/api/trending-stocks", async (req, res) => {
    try {
        const response = await axios.get("https://query1.finance.yahoo.com/v1/finance/trending/US");
        const stocks = response.data.finance.result[0].quotes.map(stock => ({
            symbol: stock.symbol,
            name: stock.shortName ? stock.shortName : stock.symbol,
            price: stock.regularMarketPrice || "N/A",
        }));
        res.json(stocks);
    } catch (error) {
        console.error("Error fetching trending stocks:", error);
        res.status(500).json({ error: "Failed to fetch trending stocks" });
    }
});

// Fetch social media posts from StockTwits
app.get("/api/social-posts/:symbol", async (req, res) => {
    const { symbol } = req.params;
    try {
        const response = await axios.get(`https://api.stocktwits.com/api/2/streams/symbol/${symbol}.json`);
        const posts = response.data.messages.map(msg => ({
            text: msg.body,
            user: msg.user.username,
            created_at: msg.created_at
        }));
        res.json(posts);
    } catch (error) {
        console.error("Error fetching StockTwits posts:", error);
        res.status(500).json({ error: "Failed to fetch social posts" });
    }
});

app.listen(PORT, () => console.log(`Server running on http://127.0.0.1:${PORT}`));
