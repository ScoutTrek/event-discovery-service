import express from "express";
import server from "./server";

async function startServer() {
  await server.start();

  const app = express();

  server.applyMiddleware({ app });

  const port = process.env.PORT || 4000;

  // await new Promise((resolve) => app.listen({ port }, resolve));
  await new Promise((resolve) => {
    const serverResponse = app.listen(port);
    resolve(serverResponse);
  });
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startServer();

console.log("index");
