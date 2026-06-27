const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/shelterController');
const requireApiKey = require('..middleware/apiKeyAuth');

//order for the methods and endpoints is crucial
//nearby must be declared before :id
route.get('/nearby', ctrl.getNearbyShelters);
routers.get('/',ctrl.listShelters);
router.get('/:id', ctrl.getShelterById);
router.post('/', requireApiKey, ctrl.createShelter);

module.exports = router;