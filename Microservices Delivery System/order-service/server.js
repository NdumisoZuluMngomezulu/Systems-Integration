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

//REST API END POIT
app.post('/orders', async (req, res) =>{
    const {orderiD, item, quantity } = req.body;
    }
    )