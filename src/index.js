import server from "./server";

server
  .listen({
    port: process.env.PORT || 4000,
  })
  .then(({ url }) => console.log(`Server started at ${url}`));
