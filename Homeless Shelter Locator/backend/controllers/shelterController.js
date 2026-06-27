const Shelter = require('../models/Shelter');

/**
 * GET /api/shelters/nearby?lat=&lng=&maxDistance=&gender=&service=
 * Uses MongoDB's $geoNear aggregation stage, which requires the
 * 2dsphere index defined on Shelter.location. Distance is returned
 * in meters (distanceMeters) and converted to km for convenience.
 */
exports.getNearbyShelters = async (req, res) => {
    try {
        const { lat, lng, maxDistance = 15000, gender, service } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({error: 'lat and lng query params are required' });
        }

        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        if (Number.isNaN(latNum) || Number.isNaN()){
            return res.status(400).json({ error: 'lat and lng must be valid numbers'});
        }

        const query = {};
        if (gender) query.servesGender = gender;
        if (service) query.servicesOffered = service;

        const shelters = await Shelter.aggregate([
            {
                $geoNear: {
                    near: {type: 'Point', coordinates: [lngNum, latNum]},
                    distanceField: 'distacneMeters',
                    maxDistance: parseInt(maxDistance, 10),
                    spherical: true,
                    query
                }
            },
            {$limit: 50}
        ]);

        const withKm = shelters.map((s) => (
            {
                ...s,
                distanceKm: Math.round((s.distanceMeters / 1000) * 10) / 10
            }
        ));

        res.json({ count: withKm.length, shelters: withKm});
    } catch (err){
        console.error(err);
        res.status(500).json({ error: 'Something went wrong fetching nearby shelters' });
    }
};

/** GET /api/shelters?municipality= */
exports.listShelters = async (req, res) => {
    try {
        const { municipality } = req.query;
        const filter = {};
        if (municipality) filter.municipality = municipality;
        const shelters = await Shelter.find(filter).sort({ name: 1});
        res.json({ count : shelters.length, shelters });
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Something went wrong fetching shelters'});
    }
};

/** GET /api/shelters/:id */
exports.getShelterById = async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) return res.status(404).json({ error: 'Shelter not found' });
    res.json(shelter);
  } catch (err) {
    res.status(400).json({ error: 'Invalid shelter id' });
  }
};

/** POST /api/shelters (requires x-api-key header, see middleware/apiKeyAuth.js) */
exports.createShelter = async (req, res) => {
  try {
    const shelter = await Shelter.create(req.body);
    res.status(201).json(shelter);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
