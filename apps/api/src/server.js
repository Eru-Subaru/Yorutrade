"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = 4000;
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json());
app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "yorutrade-api",
    });
});
app.listen(PORT, () => {
    console.log(`YoruTrade API running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map