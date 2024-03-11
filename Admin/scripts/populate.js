const mongoose = require('mongoose');
const Hotel = require('../AdminModel/adminschema');

async function populate() {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const hotels = [
        { name: 'Hotel One', location: 'New York', rooms: 100, price: 200, image: 'url_to_image_one' },
        { name: 'Hotel Two', location: 'Los Angeles', rooms: 150, price: 250, image: 'url_to_image_two' },
        // Add more hotels as needed
    ];

    await Hotel.insertMany(hotels);
    console.log('Database populated');
    process.exit();
}

populate();