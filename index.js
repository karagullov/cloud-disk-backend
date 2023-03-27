const express = require("express");
const mongoose = require("mongoose");
const config = require("config");
const authRouter = require("./routes/auth.routes");
const fileRouter = require("./routes/file.routes");
const corsMiddleware = require("./middleware/cors.middleware");
const filePathMiddleware = require("./middleware/filepath.middleware");
const fileUpload = require("express-fileupload");
const path = require("path");

const app = express();
const PORT = process.env.PORT || config.get("serverPort");

app.use(fileUpload({}));
app.use(corsMiddleware);
app.use(filePathMiddleware(path.resolve(__dirname, "files")));
app.use(express.json());
app.use(express.static("static"));
app.use("/api/auth", authRouter);
app.use("/api/files", fileRouter);

const start = async () => {
  try {
    await mongoose.connect(config.get("dbURL"));
    app.listen(PORT, () => {
      console.log("Server running on PORT: ", PORT);
    });
  } catch (e) {
    console.log(e);
  }
};

start();
