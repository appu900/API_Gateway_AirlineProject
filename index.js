const express = require("express");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

const app = express();
const PORT = 8000;

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 5,
});

app.use(morgan("combined"));
app.use(express.json());
app.use(limiter);

// ** middleware for check authenticated user before making request for booking service
app.use("/bookingservice", async (req, res, next) => {
  const token = req.headers["x-access-token"];
  if(!token) {
    return res.json({
      message: "unauthorized"
    });
  }
  console.log("token is", token);
  try {
    const response = await axios.post(
      "http://localhost:5001/api/v1/isAuthenticated",
      {},
      {
        headers: {
          "x-access-token": token,
        },
      }
    );
    if (response.data.success) {
      const userId = response.data.data;
      req.headers['x-user-id'] = userId;
      next();
    } else {
      res.json({
        message: "unauthorized",
      });
    }
  } catch (error) {
    console.log("error in apigateway", error);
    res.json({
      message: "unauthorized",
      error: error.message,
    });
  }
});

app.use(
  "/bookingservice",
  createProxyMiddleware({
    target: "http://localhost:5002/",
    changeOrigin: true,
  })
);

// ** for testing purpose this is it .
app.get("/home", (req, res) => {
  return res.json({
    message: "ok",
  });
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});





