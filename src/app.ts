import express, { Application, Request } from "express"
import { Controller } from "./utils/interfaces/controller.interface";
import http, { Server } from "http"
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import { ErrorMiddleWare } from "./middlewares/error.middleware";
import { Error404Middleware } from "./middlewares/error-404.middlewares";
import debug from "debug";
import dotenv from "dotenv";
import { seedSuperAdmin } from "./resources/users/user.services";

dotenv.config();
export class App {
    public app: Application;

    public port: number | undefined;
    private server: Server;

    constructor(controllers: Controller[], port?: number) {
        debug(this.constructor.name);
        this.app = express();
        this.port = port
        this.server = http.createServer(this.app);
        this.initialiseDatabaseConnection()
        this.initialiseMiddleware()
        this.initialiseControllers(controllers)
        this.routeError404();
        this.initialiseErrorHandling();
    }

    //all global middlewares here
    private initialiseMiddleware(): void {
        // this.app.use(helmet());

        this.app.use(cors({
            origin: '*'
        }));
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
        const { MONGO_URL } = process.env;
        const connectDB = async () => {
            try {
                await mongoose.connect(`${MONGO_URL}`, {
                    serverSelectionTimeoutMS: 5000,
                });
                console.log('Connected to MongoDB');
                if (process.env.NODE_ENV === "development") {
                    seedSuperAdmin() // no need to call endpoint
                }
            } catch (error) {
                console.error('Initial connection error:', error);
                setTimeout(connectDB, 5000);
            }
        };

        connectDB();
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
