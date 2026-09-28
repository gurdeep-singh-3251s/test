import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { attachUser, requireOwner } from "./middleware/auth.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { staffRouter } from "./routes/staff.js";
import { categoryRouter } from "./routes/categories.js";
import { contactRouter } from "./routes/contact.js";
import { orderRouter } from "./routes/orders.js";
import { productRouter } from "./routes/products.js";
import { subscriberRouter } from "./routes/subscribers.js";
import { errorHandler } from "./middleware/error.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const clientOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (clientOrigins.includes(origin)) return callback(null, true);
      if (process.env.ALLOW_VERCEL_PREVIEWS === "true" && origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(attachUser);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    store: "BMS Fashionz",
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/staff", staffRouter);
app.use("/api/admin", requireOwner, adminRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/contact", contactRouter);
app.use("/api/subscribers", subscriberRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  console.warn("Set AUTH_SECRET in server/.env before going live.");
}

app.listen(port, "0.0.0.0", () => {
  console.log(`BMS Fashionz API ready on http://0.0.0.0:${port}`);
});
