import "dotenv/config";
import express from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import rateLimit from "express-rate-limit";

import { z } from "zod";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// setup rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);

// Create User
const CreateUserSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string(),
  active: z.boolean(),
  username: z.string().optional(),
  country: z.string().length(2).toUpperCase().optional(),
});

app.post("/api/users", async (req, res, _) => {
  try {
    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: z.treeifyError(parsed.error) });
      return;
    }

    const { first_name, email, last_name, active, username, country } =
      parsed.data;
    const newUser = await prisma.user.create({
      data: {
        first_name,
        email,
        last_name,
        active,
        username,
        country,
      },
    });
    res.status(201).json(newUser);
  } catch (err) {
    console.error("POST /api/users failed:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// get all users /api/users?country=US
//     optional paginate with limit and offset, and country filter
app.get("/api/users", async (req, res) => {
  try {
    const { country, limit = "10", offset = "0" } = req.query;
    const where = country ? { country: String(country) } : undefined;
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: parseInt(String(limit)),
        skip: parseInt(String(offset)),
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ data, total });
  } catch (err) {
    console.error("GET /api/users failed:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// get all users with duplicate first name + last name combinations
app.get("/api/users/duplicates", async (req, res) => {
  try {
    const { limit = "10", offset = "0", minCount = "1", active } = req.query;
    const where =
      active === "true" ? { active: true } :
      active === "false" ? { active: false } :
      undefined;
    const having = { id: { _count: { gt: parseInt(String(minCount)) } } };
    const [duplicates, allDuplicates] = await Promise.all([
      prisma.user.groupBy({
        by: ["first_name", "last_name"],
        where,
        _count: { id: true },
        having,
        orderBy: { _count: { id: "desc" } },
        take: parseInt(String(limit)),
        skip: parseInt(String(offset)),
      }),
      prisma.user.groupBy({
        by: ["first_name", "last_name"],
        where,
        _count: { id: true },
        having,
      }),
    ]);
    res.json({
      data: duplicates.map((d) => ({
        first_name: d.first_name,
        last_name: d.last_name,
        count: d._count.id,
      })),
      total: allDuplicates.length,
    });
  } catch (err) {
    console.error("GET /api/users/duplicates failed:", err);
    res.status(500).json({ error: "Failed to fetch duplicate users" });
  }
});

const STATE_COORDS: Record<string, { lat: number; lon: number }> = {
  AL: { lat: 32.806671, lon: -86.79113 },
  AK: { lat: 61.370716, lon: -152.404419 },
  AZ: { lat: 33.729759, lon: -111.431221 },
  AR: { lat: 34.969704, lon: -92.373123 },
  CA: { lat: 36.116203, lon: -119.681564 },
  CO: { lat: 39.059811, lon: -105.311104 },
  CT: { lat: 41.597782, lon: -72.755371 },
  DE: { lat: 39.318523, lon: -75.507141 },
  FL: { lat: 27.766279, lon: -81.686783 },
  GA: { lat: 33.040619, lon: -83.643074 },
  HI: { lat: 21.094318, lon: -157.498337 },
  ID: { lat: 44.240459, lon: -114.478828 },
  IL: { lat: 40.349457, lon: -88.986137 },
  IN: { lat: 39.849426, lon: -86.258278 },
  IA: { lat: 42.011539, lon: -93.210526 },
  KS: { lat: 38.5266, lon: -96.726486 },
  KY: { lat: 37.66814, lon: -84.670067 },
  LA: { lat: 31.16996, lon: -91.867805 },
  ME: { lat: 44.693947, lon: -69.381927 },
  MD: { lat: 39.063946, lon: -76.802101 },
  MA: { lat: 42.230171, lon: -71.530106 },
  MI: { lat: 43.326618, lon: -84.536095 },
  MN: { lat: 45.694454, lon: -93.900192 },
  MS: { lat: 32.741646, lon: -89.678696 },
  MO: { lat: 38.456085, lon: -92.288368 },
  MT: { lat: 46.921925, lon: -110.454353 },
  NE: { lat: 41.12537, lon: -98.268082 },
  NV: { lat: 38.313515, lon: -117.055374 },
  NH: { lat: 43.452492, lon: -71.563896 },
  NJ: { lat: 40.298904, lon: -74.521011 },
  NM: { lat: 34.840515, lon: -106.248482 },
  NY: { lat: 42.165726, lon: -74.948051 },
  NC: { lat: 35.630066, lon: -79.806419 },
  ND: { lat: 47.528912, lon: -99.784012 },
  OH: { lat: 40.388783, lon: -82.764915 },
  OK: { lat: 35.565342, lon: -96.928917 },
  OR: { lat: 44.572021, lon: -122.070938 },
  PA: { lat: 40.590752, lon: -77.209755 },
  RI: { lat: 41.680893, lon: -71.51178 },
  SC: { lat: 33.856892, lon: -80.945007 },
  SD: { lat: 44.299782, lon: -99.438828 },
  TN: { lat: 35.747845, lon: -86.692345 },
  TX: { lat: 31.054487, lon: -97.563461 },
  UT: { lat: 40.150032, lon: -111.862434 },
  VT: { lat: 44.045876, lon: -72.710686 },
  VA: { lat: 37.769337, lon: -78.169968 },
  WA: { lat: 47.400902, lon: -121.490494 },
  WV: { lat: 38.491226, lon: -80.954453 },
  WI: { lat: 44.268543, lon: -89.616508 },
  WY: { lat: 42.755966, lon: -107.30249 },
};

app.get("/api/weather/:state", async (req, res) => {
  const state = req.params.state.toUpperCase();
  const coords = STATE_COORDS[state];
  if (!coords) {
    res.status(400).json({ error: `Unknown state code: ${state}` });
    return;
  }
  try {
    const pointsRes = await fetch(
      `https://api.weather.gov/points/${coords.lat},${coords.lon}`,
      { headers: { "User-Agent": "nectar-technical-assessment" } },
    );
    if (!pointsRes.ok) {
      res
        .status(502)
        .json({ error: "Failed to reach National Weather Service" });
      return;
    }
    const pointsData = (await pointsRes.json()) as {
      properties: { forecast: string };
    };
    const forecastRes = await fetch(pointsData.properties.forecast, {
      headers: { "User-Agent": "nectar-technical-assessment" },
    });
    if (!forecastRes.ok) {
      res.status(502).json({
        error: "Failed to fetch forecast from National Weather Service",
      });
      return;
    }
    const forecastData = (await forecastRes.json()) as {
      properties: {
        periods: {
          name: string;
          temperature: number;
          temperatureUnit: string;
          windSpeed: string;
          windDirection: string;
          shortForecast: string;
          detailedForecast: string;
          isDaytime: boolean;
        }[];
      };
    };
    res.json({ state, periods: forecastData.properties.periods });
  } catch (err) {
    console.error(`GET /api/weather/${state} failed:`, err);
    res.status(500).json({ error: "Failed to fetch weather forecast" });
  }
});

app.get("/api/health", (_, res, __) => {
  res.sendStatus(200);
});

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, "../dist")));

// For Single Page Application (SPA) routing
app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

const port = Number(process.env.PORT) || 3001;
const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", {
    message: err.message,
    stack: err.stack,
  });
  server.close(() => {
    console.log("Server Closed");
    void prisma.$disconnect();
    process.exit(1); // Exit the process with a failure code
  });

  // If server.close() doesn't work for some reason, exit immediately
  setTimeout(() => {
    console.log("Forcing process exit");
    void prisma.$disconnect();
    process.exit(1);
  }, 5000); // Force exit after 5 seconds in case server doesn't close
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  server.close(() => {
    console.log("Server Closed");
    void prisma.$disconnect();
    process.exit(1); // Exit the process with a failure code
  });

  // If server.close() doesn't work for some reason, exit immediately
  setTimeout(() => {
    console.log("Forcing process exit");
    void prisma.$disconnect();
    process.exit(1);
  }, 5000); // Force exit after 5 seconds in case server doesn't close
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Cleaning up...");
  server.close(() => {
    console.log("Server Closed");
    void prisma.$disconnect();
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("Received SIGINT. Cleaning up...");
  server.close(() => {
    console.log("Server Closed");
    void prisma.$disconnect();
    process.exit(0);
  });
});
