import "dotenv/config";
import express from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.post("/api/users", async (req, res, _) => {
  try {
    const { first_name, email, last_name, active, country, username } =
      req.body;
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

// /api/users?country=US
//     optional paginate with limit and offset
app.get("/api/users", async (req, res) => {
  try {
    const { country, limit = "50", offset = "0" } = req.query;
    const users = await prisma.user.findMany({
      where: country ? { country: String(country) } : undefined,
      take: parseInt(String(limit)),
      skip: parseInt(String(offset)),
    });
    res.json(users);
  } catch (err) {
    console.error("GET /api/users failed:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// get all users with duplicate first name + last name combinations
app.get("/api/users/duplicates", async (req, res) => {
  try {
    const { limit = "50", offset = "0" } = req.query;
    const duplicates = await prisma.user.groupBy({
      by: ["first_name", "last_name"],
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } },
      },
      orderBy: {
        _count: { id: "desc" },
      },
      take: parseInt(String(limit)),
      skip: parseInt(String(offset)),
    });

    // restructure json to make count more easily usable
    res.json(
      duplicates.map((d) => ({
        first_name: d.first_name,
        last_name: d.last_name,
        count: d._count.id,
      })),
    );
  } catch (err) {
    console.error("GET /api/users/duplicates failed:", err);
    res.status(500).json({ error: "Failed to fetch duplicate users" });
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
