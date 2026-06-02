// ─────────────────────────────────────────────────────────────────────────────
// server.js — PokeUs Custom Next.js + Socket.IO Server
// ─────────────────────────────────────────────────────────────────────────────

if (process.argv.includes("--production")) {
  process.env.NODE_ENV = "production";
}

// Load environment variables before anything else
require("dotenv").config({ path: ".env.local" });

// ─── Startup Environment Validation ──────────────────────────────────────────
// Fail fast with a clear error if required variables are missing.
const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
];

const missingVars = REQUIRED_ENV_VARS.filter(
  (key) => !process.env[key] || process.env[key].trim() === ""
);
if (missingVars.length > 0) {
  console.error(
    `\n❌ STARTUP FAILED — Missing required environment variables:\n${missingVars.map((k) => `  - ${k}`).join("\n")}\n\nPlease configure your .env.local file. See .env.example for reference.\n`
  );
  process.exit(1);
}

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

// Never allow wildcard CORS in production
const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;

// Initialize the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const { createClient } = require("@supabase/supabase-js");
  const { PrismaClient } = require("@prisma/client");

  // Initialize Supabase with anon key for JWT verification only
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const prisma = new PrismaClient();

  // Attach Socket.IO to the HTTP server with strict CORS
  const io = new Server(server, {
    cors: {
      origin: allowedOrigin, // Exact origin only — no wildcard fallback
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ─── Socket.IO Authentication Middleware ─────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error: Token is required"));
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return next(new Error("Authentication error: Invalid or expired token"));
      }

      socket.supabaseUser = user;
      next();
    } catch (err) {
      // Never surface internal error details to the client
      return next(new Error("Authentication error"));
    }
  });

  // ─── Socket.IO Event Handlers ─────────────────────────────────────────────
  io.on("connection", (socket) => {
    // Only log in development to avoid leaking socket IDs in production
    if (dev) {
      console.log("[socket] Client connected:", socket.id);
    }

    // Join a private room based on the couple ID
    socket.on("join_room", async (data) => {
      const coupleId = typeof data === "string" ? data : data?.coupleId;
      if (!coupleId) {
        return socket.emit("error_msg", "coupleId is required");
      }

      try {
        // Fetch the user in Prisma using the verified supabaseUser.id
        const user = await prisma.user.findUnique({
          where: { supabaseId: socket.supabaseUser.id },
          include: {
            coupleAsUser1: { select: { id: true } },
            coupleAsUser2: { select: { id: true } },
          },
        });

        if (!user) {
          return socket.emit("error_msg", "User not found");
        }

        // Verify the user belongs to the requested couple
        const userCoupleId =
          user.coupleAsUser1[0]?.id || user.coupleAsUser2[0]?.id;
        if (!userCoupleId || userCoupleId !== coupleId) {
          return socket.emit(
            "error_msg",
            "Unauthorized: You do not belong to this couple"
          );
        }

        socket.join(coupleId);
        socket.coupleId = coupleId;
        socket.userId = user.id;

        if (dev) {
          console.log(`[socket] User joined room: ${coupleId}`);
        }

        // Determine online users in this room
        const clients = io.sockets.adapter.rooms.get(coupleId);
        const onlineUsers = [];
        if (clients) {
          for (const clientId of clients) {
            const clientSocket = io.sockets.sockets.get(clientId);
            if (
              clientSocket &&
              clientSocket.userId &&
              clientSocket.userId !== user.id
            ) {
              onlineUsers.push(clientSocket.userId);
            }
          }
        }

        socket.emit("online_users", onlineUsers);
        socket.to(coupleId).emit("user_connected", user.id);
      } catch (err) {
        if (dev) console.error("[socket] join_room error:", err);
        socket.emit("error_msg", "Failed to join room");
      }
    });

    // Relay messages — validate room membership before forwarding
    socket.on("send_message", (data) => {
      if (!socket.coupleId || data.coupleId !== socket.coupleId) {
        return socket.emit("error_msg", "Unauthorized room transmission");
      }
      socket.to(socket.coupleId).emit("receive_message", data);
    });

    // Relay message reactions
    socket.on("send_reaction", (data) => {
      if (!socket.coupleId || data.coupleId !== socket.coupleId) {
        return socket.emit("error_msg", "Unauthorized room transmission");
      }
      socket.to(socket.coupleId).emit("receive_reaction", data);
    });

    // Relay message read receipts
    socket.on("messages_read", (data) => {
      if (!socket.coupleId || data.coupleId !== socket.coupleId) {
        return socket.emit("error_msg", "Unauthorized room transmission");
      }
      socket.to(socket.coupleId).emit("receive_messages_read", data);
    });

    // Typing indicators
    socket.on("typing", (data) => {
      if (!socket.coupleId || data.coupleId !== socket.coupleId) return;
      socket.to(socket.coupleId).emit("partner_typing", true);
    });

    socket.on("stop_typing", (data) => {
      if (!socket.coupleId || data.coupleId !== socket.coupleId) return;
      socket.to(socket.coupleId).emit("partner_typing", false);
    });

    socket.on("disconnect", () => {
      if (dev) {
        console.log("[socket] Client disconnected:", socket.id);
      }
      const { coupleId, userId } = socket;
      if (coupleId && userId) {
        const clients = io.sockets.adapter.rooms.get(coupleId);
        let userStillConnected = false;
        if (clients) {
          for (const clientId of clients) {
            const clientSocket = io.sockets.sockets.get(clientId);
            if (
              clientSocket &&
              clientSocket.userId === userId &&
              clientSocket.id !== socket.id
            ) {
              userStillConnected = true;
              break;
            }
          }
        }

        if (!userStillConnected) {
          socket.to(coupleId).emit("user_disconnected", userId);
        }
      }
    });
  });

  server.once("error", (err) => {
    console.error("[server] Fatal error:", err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`▶  Ready on ${allowedOrigin || `http://${hostname}:${port}`}`);
    if (dev) {
      console.log("▶  Socket.IO server running (development mode)");
    }
  });
});
