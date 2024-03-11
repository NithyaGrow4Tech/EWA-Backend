const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');

// Update hotel
router.put('/hotels/:id', async (req, res) => {
    try {
        const updatedHotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedHotel);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete hotel
router.delete('/hotels/:id', async (req, res) => {
    try {
        await Hotel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Hotel deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;