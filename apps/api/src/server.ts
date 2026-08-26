import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "yorutrade-api",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "yorutrade-api",
  });
});

app.listen(PORT, () => {
  console.log(`YoruTrade API running on http://localhost:${PORT}`);
});