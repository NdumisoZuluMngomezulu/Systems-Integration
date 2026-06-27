const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const shelterRoutes = require('./routes/shelterRoutes');

const app = express();

app.use(cors());
app.use(express.json());
if(process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => res.json({ status: 'ok'}));
app.use('/api/shelters', shelterRoutes);

app.use((req, res) => res.status(404).json({erro: 'Not found'}));

module.exports = app;