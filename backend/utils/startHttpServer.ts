import type { Express } from "express";
import type { Server } from "node:http";

export const startHttpServer = async (
  app: Express,
  database: { authenticate: () => Promise<void> },
  port: number,
): Promise<Server> => {
  await database.authenticate();
  return new Promise((resolve, reject) => {
    const server = app.listen(port, "0.0.0.0");
    server.once("error", reject);
    server.once("listening", () => {
      server.removeListener("error", reject);
      resolve(server);
    });
  });
};
