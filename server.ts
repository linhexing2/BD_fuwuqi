import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Store active servers in memory (since we're using Plan B)
  // In a real app, this would be a database
  let activeServers = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Send current list to new user
    socket.emit("server-list", Array.from(activeServers.values()));

    socket.on("broadcast-server", (serverData) => {
      const server = {
        ...serverData,
        id: socket.id,
        lastSeen: Date.now(),
      };
      activeServers.set(socket.id, server);
      io.emit("server-list", Array.from(activeServers.values()));
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      activeServers.delete(socket.id);
      io.emit("server-list", Array.from(activeServers.values()));
    });
  });

  // Cleanup stale servers every 30 seconds
  setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [id, server] of activeServers.entries()) {
      if (now - server.lastSeen > 60000) { // 1 minute timeout
        activeServers.delete(id);
        changed = true;
      }
    }
    if (changed) {
      io.emit("server-list", Array.from(activeServers.values()));
    }
  }, 30000);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
