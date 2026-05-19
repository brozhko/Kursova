const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: '',
    ssl: { rejectUnauthorized: false }
});

const TELEGRAM_TOKEN = '';
const CHAT_ID = '';

let lastAlertTime = 0;
const ALERT_INTERVAL = 10800000; //

async function sendTelegramAlert(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

    try {
        await axios.post(url, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });

        console.log('✅ Сповіщення відправлено в Telegram');
    } catch (error) {
        console.error('❌ Помилка Telegram:', error.message);
    }
}

app.post('/api/data', async (req, res) => {
    const { deviceId, lux, soilMoisture, soilMoisture2, airTemp, airHumidity } = req.body;

    try {
        const query = `
            INSERT INTO agro_data (device_id, lux, soil_moisture, soil_moisture_2, air_temp, air_humidity) 
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await pool.query(query, [
            deviceId || 'Wemos_Pavlo',
            lux || 0,
            soilMoisture || 0,
            soilMoisture2 || 0,
            airTemp || 0,
            airHumidity || 0
        ]);

        console.log(`[${new Date().toLocaleTimeString()}] Збережено: ${soilMoisture}% / ${soilMoisture2}%`);


        const now = Date.now();
        const ALERT_INTERVAL = 10800000;


        const timeResult = await pool.query("SELECT value FROM system_settings WHERE key = 'last_alert_time'");
        const lastAlertTime = timeResult.rows.length > 0 ? parseInt(timeResult.rows[0].value, 10) : 0;


        if (now - lastAlertTime > ALERT_INTERVAL) {
            let alertMsg = "";


            if (soilMoisture < 30) {
                alertMsg += `\n🪴 <b>Горщик 1</b>\n└ Земля суха: <b>${soilMoisture}%</b>\n`;
            }
            if (soilMoisture2 < 30) {
                alertMsg += `\n🪴 <b>Горщик 2</b>\n└ Земля суха: <b>${soilMoisture2}%</b>\n`;
            }


            if (soilMoisture > 85) {
                alertMsg += `\n💧 <b>Горщик 1</b>\n└ Перелив: <b>${soilMoisture}%</b>\n`;
            }
            if (soilMoisture2 > 85) {
                alertMsg += `\n💧 <b>Горщик 2</b>\n└ Перелив: <b>${soilMoisture2}%</b>\n`;
            }


            if (alertMsg !== "") {
                const telegramMessage = `<b>⚠️ AgroEye</b>\n${alertMsg}\n🕒 ${new Date().toLocaleString("uk-UA")}`;

                await sendTelegramAlert(telegramMessage);

                await pool.query(
                    "UPDATE system_settings SET value = $1 WHERE key = 'last_alert_time'",
                    [now]
                );
            }
        }

        res.status(200).send({ status: 'success' });
    } catch (err) {
        console.error('❌ Помилка сервера:', err.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM agro_data ORDER BY created_at DESC LIMIT 50');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.send('🚀 Backend AgroMonitor (IR-21) is Running!');
});

module.exports = app;
