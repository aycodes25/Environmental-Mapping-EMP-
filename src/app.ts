import express, { Application, Request, Response } from "express"
import { Controller } from "./utils/interfaces/controller.interface";
import http, { Server } from "http"
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import { ErrorMiddleWare } from "./middlewares/error.middleware";
import { Error404Middleware } from "./middlewares/error-404.middlewares";
import debug from "debug";
import dotenv from "dotenv";
import path from "path";
import { seedSuperAdmin } from "./resources/users/user.services";

// Load environment-specific .env file
const envFile = process.env.NODE_ENV
    ? `.env.${process.env.NODE_ENV}`
    : '.env';

dotenv.config({
    path: path.resolve(process.cwd(), envFile),
    override: true
});

export class App {
  public app: Application;

  public port: number | undefined;
  private server: Server;

  constructor(controllers: Controller[], port?: number) {
    debug(this.constructor.name);
    this.app = express();
    this.port = port;
    this.server = http.createServer(this.app);
    this.initialiseDatabaseConnection();
    this.initialiseMiddleware();
    this.initialiseControllers(controllers);
    this.initialiseHealthCheck();
    this.routeError404();
    this.initialiseErrorHandling();
  }

  //all global middlewares here
  private initialiseMiddleware(): void {
    // this.app.use(helmet());

    this.app.use(
      cors({
        origin: "*",
      })
    );
    this.app.use(morgan("dev"));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    // this.app.use(compression());
  }
  private initialiseControllers(
    controllers: Controller[],
    baseUrl = "/api"
  ): void {
    controllers.forEach((controller: Controller) => {
      this.app.use(`${baseUrl}`, controller.router);
    });
  }

  //Error handling middleware
  private initialiseErrorHandling(): void {
    this.app.use(ErrorMiddleWare);
  }

  //Error 404 handling middleware
  private routeError404(): void {
    this.app.use(Error404Middleware);
  }

  private async initialiseDatabaseConnection(): Promise<void> {
    const { MONGO_URL, NODE_ENV } = process.env;
    console.log(MONGO_URL);
    const connectDB = async () => {
      try {
        await mongoose.connect(`${MONGO_URL}`, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`Connected to MongoDB (${NODE_ENV} environment)`);

        if (NODE_ENV === "development") {
          try {
            await seedSuperAdmin();
          } catch (error) {
            throw new Error("Error during super admin seeding");
          }
        } else {
          throw new Error(
            "Super admin seeding is not allowed in production environment"
          );
        }
      } catch (error) {
        throw error;
        // setTimeout(connectDB, 5000);
      }
    };

    connectDB();
  }

  private initialiseHealthCheck(): void {
    console.log(
      "health check endpoint ===>>>>>",
      `http://localhost:${this.port}/api/health`
    );

    this.app.get("/api/health", async (req: Request, res: Response) => {
      const dbState = mongoose.connection.readyState;
      const isDBConnected = dbState === 1;

      const healthStatus = {
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: isDBConnected ? "connected" : "disconnected",
      };

      if (!isDBConnected) {
        return res.status(500).json({ ...healthStatus, status: "error" });
      }

      res.status(200).json(healthStatus);
    });
  }

  public listen(): void {
    this.server.listen(this.port, () => {
      console.log(`App running on port : ${this.port}`);
    });
  }
}


// var whitelist = [
//     '*',
//     'http://localhost:5174',
//     'http://localhost:5173',
//     'http://1270.0.1:5173',
//     'http://127.0.0.1:5174',
//     'https://environmental-mapping-v2-fe.vercel.app',
//     'http://dev.oriontestingserver1.com',
//     'http://qa.oriontestingserver1.com',
//     'https://dev.oriontestingserver1.com',
//     'https://qa.oriontestingserver1.com'
// ];
// var corsOptionsDelegate = function (req: any, callback: any) {
//     var corsOptions;
//     if (whitelist.indexOf(req.header('Origin')) !== -1) {
//         corsOptions = { origin: true, "preflightContinue": true } // reflect (enable) the requested origin in the CORS response
//     } else {
//         corsOptions = { origin: false, "preflightContinue": true } // disable CORS for this request
//     }
//     callback(null, corsOptions) // callback expects two parameters: error and options
// }