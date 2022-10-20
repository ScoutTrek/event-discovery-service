const express = require("express");
import server from "./server";

async function startServer() {
  await server.start();

  const app = express();

  server.applyMiddleware({ app });

  const port = process.env.PORT || 4000;

  await new Promise((resolve) => app.listen({ port }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startServer();
