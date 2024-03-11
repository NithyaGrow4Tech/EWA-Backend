import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoute from "./routes/auth.js";
import usersRoute from "./routes/users.js";
import hotelsRoute from "./routes/hotels.js";
import roomsRoute from "./routes/rooms.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import axios from "axios";
import uniqid from "uniqid";
import sha256 from "sha256";

import Payment from "./payment.js";

const app = express();
dotenv.config();

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/hotels", hotelsRoute);
app.use("/api/rooms", roomsRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: err.stack,
  });
});

// PhonePe Integration
// Place this code after defining routes to avoid conflicts

const PHONE_PAY_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const MERCHANT_ID = "PGTESTPAYUAT";
const SALT_INDEX = 1;
const SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";

app.get("/", (req, res) => {
  res.send("Homepage - It's working!");
});

app.get("/pay", (req, res) => {
  const payEndpoint = "/pg/v1/pay";
  const merchantTransactionId = uniqid();
  const userID = 123;
  const payload = {
    merchantId: MERCHANT_ID,
    merchantTransactionId: merchantTransactionId,
    merchantUserId: userID,
    amount: 10000,
    redirectUrl: `https://localhost:4007/redirect-url/${merchantTransactionId}`,
    redirectMode: "REDIRECT",
    mobileNumber: "9999999999",
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };
  const bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
  const base63EncodedPayload = bufferObj.toString("base64");
  const xVerify =
    sha256(base63EncodedPayload + payEndpoint + SALT_KEY) + "###" + SALT_INDEX;

  const options = {
    method: "post",
    url: `${PHONE_PAY_URL}${payEndpoint}`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
    },
    data: {
      request: base63EncodedPayload,
    },
  };
  axios
    .request(options)
    .then(function (response) {
      console.log(response.data);
      const url = response.data.data.instrumentResponse.redirectInfo.url;
      res.redirect(url);
    })
    .catch(function (error) {
      console.error(error);
    });
});

app.get("/redirectUrl/:merchantTransactionId", (req, res) => {
  const { merchantTransactionId } = req.params;
  if (merchantTransactionId) {
    const xVerify =
      sha256(`/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + SALT_KEY) +
      "###" +
      SALT_INDEX;
    const options = {
      method: "get",
      url: `${PHONE_PAY_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-MERCHANT-ID": merchantTransactionId,
        "X-VERIFY": xVerify,
      },
    };
    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        if (response.data.code === "PAYMENT_SUCCESS") {
          const payment = new Payment({
            merchantTransactionId,
            userId: "123", // replace with actual userId
            amount: 10000, // replace with the actual payment amount
            status: "success", // Set the payment status to 'success'
          });

          // Save the payment data to the database
          payment
            .save()
            .then((savedPayment) => {
              console.log("Payment data saved:", savedPayment);
              res.redirect("/success");
            })
            .catch((error) => {
              console.error("Error saving payment data:", error); // Log the error
              res.redirect("/error");
            });
        } else if (response.data.code === "PAYMENT_ERROR") {
          res.redirect("/error");
        } else {
          res.redirect("/pending");
        }
      })
      .catch(function (error) {
        console.error("Error fetching payment status:", error); // Log the error
        res.redirect("/error");
      });
  } else {
    res.send({ error: "Error" });
  }
});

app.get("/transactions", (req, res) => {
  Payment.find({}, (err, transactions) => {
    if (err) {
      console.error("Error fetching transactions:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(transactions);
    }
  });
});

// Define PHONE_PAY_URL, MERCHANT_ID, SALT_INDEX, SALT_KEY here

// Routes for payment
// Define payment-related routes here

// Database connection
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process if unable to connect to the database
  }
};

// Start the server
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  connect();
  console.log(`Server started on port ${PORT}`);
});
