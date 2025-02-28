const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ✅ Fetch Trending Stocks
app.get("/api/trending-stocks", async (req, res) => {
    try {
        console.log("📈 Fetching live trending stocks...");
        const response = await axios.get("https://query1.finance.yahoo.com/v1/finance/trending/US");
        const trending = response.data.finance.result[0].quotes.map(stock => ({
            symbol: stock.symbol,
            name: stock.shortName || "Unknown"
        }));
        res.json({ trending });
    } catch (error) {
        console.error("❌ Error fetching trending stocks:", error.message);
        res.status(500).json({ error: "Failed to fetch trending stocks" });
    }
});

// ✅ Fetch Stock Options Data (Top Volume)
app.get("/api/options/:symbol", async (req, res) => {
    const { symbol } = req.params;
    try {
        console.log(`🔎 Fetching Alpha Vantage Options for ${symbol}...`);
        const response = await axios.get(`https://www.alphavantage.co/query`, {
            params: {
                function: "OPTION_CHAIN",
                symbol: symbol,
                apikey: "LZLFD60GBF3IK1GA" // Replace with your Alpha Vantage API Key
            }
        });

        if (!response.data || !response.data.optionChain) {
            throw new Error("No options data available.");
        }

        const options = response.data.optionChain;
        const sortedOptions = options.sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 10);
        res.json({ symbol, options: sortedOptions });

    } catch (error) {
        console.error(`❌ Error fetching options for ${symbol}:`, error.message);
        res.status(500).json({ error: "Failed to fetch options data" });
    }
});

// ✅ Fetch Social Media Posts & Stock Price
app.get("/api/social/:symbol", async (req, res) => {
    const { symbol } = req.params;
    try {
        console.log(`💬 Fetching social media posts + stock price for ${symbol}...`);
        
        const stockResponse = await axios.get(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`);
        const stockPrice = stockResponse.data.quoteResponse.result[0]?.regularMarketPrice || "N/A";

        // Fetch Reddit stock discussions
        const redditResponse = await axios.get(`https://www.reddit.com/r/StockMarket/search.json?q=${symbol}&sort=new&limit=5`);
        const socialPosts = redditResponse.data.data.children.map(post => ({
            username: `u/${post.data.author}`,
            text: post.data.title,
            timestamp: new Date(post.data.created_utc * 1000).toLocaleString(),
            stockPrice: `$${stockPrice}`
        }));

        res.json({ symbol, stockPrice: `$${stockPrice}`, posts: socialPosts });

    } catch (error) {
        console.error(`❌ Error fetching social posts for ${symbol}:`, error.message);
        res.status(500).json({ error: "Failed to fetch social posts" });
    }
});

// ✅ Fetch Economic Calendar (Next 7 Days)
app.get("/api/economic-calendar", async (req, res) => {
    try {
        console.log("📅 Fetching upcoming economic events...");

        const today = new Date().toISOString().split("T")[0];
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        const endDate = sevenDaysLater.toISOString().split("T")[0];

        const response = await axios.get(`https://api.tradingeconomics.com/calendar/?c=guest:guest&start=${today}&end=${endDate}`);

        if (!response.data || response.data.length === 0) {
            throw new Error("No economic data found.");
        }

        const importantEvents = response.data
            .filter(event => ["CPI", "PPI", "FOMC", "GDP", "Jobs", "Unemployment", "NFP", "ISM", "Consumer Confidence"]
                .some(key => event.Event.includes(key)))
            .map(event => ({
                date: event.Date,
                time: event.Hour || "N/A",
                event: event.Event,
                country: event.Country,
                actual: event.Actual || "N/A",
                forecast: event.Forecast || "N/A",
                previous: event.Previous || "N/A"
            }));

        res.json({ events: importantEvents });

    } catch (error) {
        console.error("❌ Error fetching economic data:", error.message);
        res.status(500).json({ error: "Failed to fetch economic data", details: error.message });
    }
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
});


