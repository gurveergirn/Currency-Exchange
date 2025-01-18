const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const db = require('./db');
const app = express();
const cors = require('cors');
app.use(cors());
const path = require('path');

// Frontend
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});


app.use(bodyParser.json());


app.get('/exchange-rates', async (req, res) => {
    try {
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
        const rates = response.data.rates;

        for (const [currency, rate] of Object.entries(rates)) {
            db.run(
                `INSERT INTO ExchangeRates (currency_from, currency_to, rate)
                 VALUES ('USD', ?, ?)
                 ON CONFLICT(currency_from, currency_to)
                 DO UPDATE SET rate = ?, last_updated = CURRENT_TIMESTAMP`,
                [currency, rate, rate],
                function (err) {
                    if (err) {
                        console.error(`Error inserting/updating rate for USD to ${currency}:`, err.message);
                    } else {
                        console.log(`Updated rate for USD to ${currency}: ${rate}`);
                    }
                }
            );
        }

        res.json({ success: true, message: 'Exchange rates updated.' });
    } catch (error) {
        console.error('Error fetching exchange rates:', error.message);
        res.status(500).json({ error: 'Failed to fetch exchange rates.' });
    }
});

// Convert currency
app.post('/convert', (req, res) => {
    const { currency_from, currency_to, amount } = req.body;

    db.get(
        `SELECT rate FROM ExchangeRates WHERE currency_from = ? AND currency_to = ?`,
        [currency_from, currency_to],
        (err, row) => {
            if (err) {
                console.error('Database error:', err.message);
                res.status(500).json({ error: 'Database error' });
            } else if (!row) {
                console.error(`Exchange rate not found for ${currency_from} to ${currency_to}`);
                res.status(404).json({ error: 'Exchange rate not found.' });
            } else {
                const rate = row.rate;
                const converted = amount * rate;
                res.json({ converted, rate });
            }
        }
    );
});


// Fetch Conversion history
app.get('/transactions', (req, res) => {
    db.all(`SELECT * FROM Transactions`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Start server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
