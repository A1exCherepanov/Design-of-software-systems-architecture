import express from "express";
import cors from "cors";
import controller from "./controller.js";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "auth-service" })
);

app.post("/sign-in",      controller.signIn);
app.post("/sign-up",      controller.signUp);
app.get("/verify-token",  controller.verifyToken);

export default app;
