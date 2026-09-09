if (process.env.NODE_ENV) process.env.NODE_ENV = process.env.NODE_ENV.trim();
import "dotenv/config";
import { App } from "./app";
import { UserRoute } from "./resources/users/user.routes";
import { ModelRoute } from "./resources/models/model.routes";
import { TagsRoute } from "./resources/tags/tags.router";
import { CommentRoutes } from "./resources/comments/comments.routes";
import { SampleRoutes } from "./resources/sample/sample.routes";
import { LocationRoutes } from "./resources/locations/locations.routes";
import { Granular } from "./resources/granular/granular.routes";
import { IncidentRoutes } from "./resources/incident/incident.routes";
import { FilesRoute } from "./resources/localfile/localfile.router";
import { FeedbackRoutes } from "./resources/feedback/feedback.routes";
import { NotificationRoutes } from "./resources/notifications/notification.route";
const app = new App(
    [
        new UserRoute(),
        new ModelRoute(),
        new TagsRoute(),
        new CommentRoutes(),
        new SampleRoutes(),
        new LocationRoutes(),
        new Granular(),
        new IncidentRoutes(),
        new FilesRoute(),
        new FeedbackRoutes(),
        new NotificationRoutes()
    ],
    Number(process.env.PORT)
)


app.listen();

export default app.app;
