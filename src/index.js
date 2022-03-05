const express = require("express");
const { graphqlUploadExpress } = require("graphql-upload");
import server from "./server";

async function startServer() {
  await server.start();

  const app = express();

  // This middleware should be added before calling `applyMiddleware`.
  app.use(graphqlUploadExpress());

  server.applyMiddleware({ app });

  const port = process.env.PORT || 4000;

  await new Promise((resolve) => app.listen({ port }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startServer();
