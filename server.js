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

  // Attach Socket.IO to the HTTP server
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a private room based on the couple ID
    socket.on("join_room", (data) => {
      const coupleId = typeof data === "string" ? data : data?.coupleId;
      const userId = typeof data === "string" ? null : data?.userId;

      if (coupleId) {
        socket.join(coupleId);
        socket.coupleId = coupleId;
        console.log(`Socket ${socket.id} joined room ${coupleId}`);

        if (userId) {
          socket.userId = userId;
          console.log(`Socket ${socket.id} associated with User ${userId}`);

          // Determine online users in this room
          const clients = io.sockets.adapter.rooms.get(coupleId);
          const onlineUsers = [];
          if (clients) {
            for (const clientId of clients) {
              const clientSocket = io.sockets.sockets.get(clientId);
              if (clientSocket && clientSocket.userId && clientSocket.userId !== userId) {
                onlineUsers.push(clientSocket.userId);
              }
            }
          }

          // Emit the list of currently online users back to the client that just joined
          socket.emit("online_users", onlineUsers);

          // Broadcast to everyone else in the room that this user connected
          socket.to(coupleId).emit("user_connected", userId);
        }
      }
    });

    // Relay messages to the specific couple room
    socket.on("send_message", (data) => {
      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(data.coupleId).emit("receive_message", data);
    });

    // Relay message reactions to the couple room
    socket.on("send_reaction", (data) => {
      socket.to(data.coupleId).emit("receive_reaction", data);
    });

    // Relay message read status to the couple room
    socket.on("messages_read", (data) => {
      socket.to(data.coupleId).emit("receive_messages_read", data);
    });

    // Typing indicators
    socket.on("typing", (data) => {
      socket.to(data.coupleId).emit("partner_typing", true);
    });

    socket.on("stop_typing", (data) => {
      socket.to(data.coupleId).emit("partner_typing", false);
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
