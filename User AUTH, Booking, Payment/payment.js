import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    merchantTransactionId: { type: String, required: true },
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Define the Mongoose model and specify the collection name 'payments'
const Payment = mongoose.model('Payment', paymentSchema, 'payments');

export default Payment;
