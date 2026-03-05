import express from "express";
import cors from "cors";
import controller from "./controller.js";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "products-service" })
);

app.get("/cases",               controller.getCases);
app.get("/cases-json",          controller.getCasesJSON);
app.get("/graphics-cards",      controller.getGraphicsCards);
app.get("/graphics-cards-json", controller.getGraphicsCardsJSON);
app.get("/memory",              controller.getMemory);
app.get("/memory-json",         controller.getMemoryJSON);
app.get("/motherboards",        controller.getMotherboards);
app.get("/motherboards-json",   controller.getMotherboardsJSON);
app.get("/power-supplies",      controller.getPowerSupplies);
app.get("/power-supplies-json", controller.getPowerSuppliesJSON);
app.get("/processors",          controller.getProcessors);
app.get("/processors-json",     controller.getProcessorsJSON);
app.get("/storage",             controller.getStorage);
app.get("/storage-json",        controller.getStorageJSON);

export default app;
