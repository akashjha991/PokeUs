if (process.argv.includes("--production")) {
  process.env.NODE_ENV = "production";
}

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : "0.0.0.0";
const port = process.env.PORT || 3000;

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let supabase = null;

  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.error(
      "CRITICAL: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are missing. Socket authentication will be disabled."
    );
  }

  const prisma = new PrismaClient();

  // Attach Socket.IO to the HTTP server
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  // Socket.IO authentication middleware via Supabase JWT
  io.use(async (socket, next) => {
    try {
      if (!supabase) {
        console.error("Socket auth error: Supabase client is not initialized.");
        return next(new Error("Authentication error: Server is misconfigured"));
      }
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error: Token is required"));
      }

      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return next(new Error("Authentication error: Invalid or expired token"));
      }

      socket.supabaseUser = user;
      next();
    } catch (err) {
      console.error("Socket auth middleware error:", err);
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Client authenticated:", socket.id);

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
          return socket.emit("error_msg", "User not found in database");
        }

        // Verify the user belongs to the requested couple
        const userCoupleId = user.coupleAsUser1[0]?.id || user.coupleAsUser2[0]?.id;
        if (!userCoupleId || userCoupleId !== coupleId) {
          return socket.emit("error_msg", "Unauthorized: You do not belong to this couple");
        }

        socket.join(coupleId);
        socket.coupleId = coupleId;
        socket.userId = user.id; // Store Prisma user ID
        console.log(`Socket ${socket.id} (User ${user.id}) joined room ${coupleId}`);

        // Determine online users in this room
        const clients = io.sockets.adapter.rooms.get(coupleId);
        const onlineUsers = [];
        if (clients) {
          for (const clientId of clients) {
            const clientSocket = io.sockets.sockets.get(clientId);
            if (clientSocket && clientSocket.userId && clientSocket.userId !== user.id) {
              onlineUsers.push(clientSocket.userId);
            }
          }
        }

        // Emit the list of currently online users back to the client that just joined
        socket.emit("online_users", onlineUsers);

        // Broadcast to everyone else in the room that this user connected
        socket.to(coupleId).emit("user_connected", user.id);
      } catch (err) {
        console.error("join_room error:", err);
        socket.emit("error_msg", "Failed to join room");
      }
    });

    // Relay messages to the specific couple room
    socket.on("send_message", (data) => {
      if (!socket.coupleId || data.coupleId !== socket.coupleId) {
        return socket.emit("error_msg", "Unauthorized room transmission");
      }
      socket.to(socket.coupleId).emit("receive_message", data);
    });

    // Relay message reactions to the couple room
    socket.on("send_reaction", (data) => {
      if (!socket.coupleId || data.coupleId !== socket.coupleId) {
        return socket.emit("error_msg", "Unauthorized room transmission");
      }
      socket.to(socket.coupleId).emit("receive_reaction", data);
    });

    // Relay message read status to the couple room
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
      console.log("Client disconnected:", socket.id);
      const { coupleId, userId } = socket;
      if (coupleId && userId) {
        // Check if there are any other sockets in this coupleId room for the same userId
        const clients = io.sockets.adapter.rooms.get(coupleId);
        let userStillConnected = false;
        if (clients) {
          for (const clientId of clients) {
            const clientSocket = io.sockets.sockets.get(clientId);
            if (clientSocket && clientSocket.userId === userId && clientSocket.id !== socket.id) {
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
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running`);
  });
});
