const express = require('express');
const amgp = require('amgplib');
const { appendFile } = require('node:fs');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = 3000;
const QUEUE_NAME = 'order_queue';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amgp:localhost';

let channel;

async function connectRabbitMQ(){
    try{
        const connection = await amgp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertQueue(QUEUE_NAME, { durable: true});
        console.log('Connection to RabbitMQ is a success');
    } catch (error){
        console.error('RabbitMQ Connection Failed. Retrying in 5s...', error.message);
        setTimeout(connectRabbitMQ, 5000);
    }
}
connectRabbitMQ();

// REST API Endpoint
app.post('/orders', async (req, res) => {
    const { orderId, item, quantity } = req.body;

    if (!orderId || !item || !quantity) {
        return res.status(400).json({ error: 'Missing order details' });
    }

    const orderPayload = { orderId, item, quantity, timestamp: new Date() };

    try {
        // Convert the payload to a Buffer string to send across the network
        channel.sendToQueue(
            QUEUE_NAME,
            Buffer.from(JSON.stringify(orderPayload)),
            { persistent: true } // Keeps message safe if RabbitMQ crashes
        );

        console.log(`[Order Service] Sent event for Order: ${orderId}`);
        return res.status(202).json({ message: 'Order received and is processing asynchronously.' });
    } catch (error) {
        console.error('Failed to publish event:', error);
        return res.status(500).json({ error: 'Internal systems failure' });
    }
});

app.listen(PORT, () => {
    console.log(`Order Service listening on port ${PORT}`);
});