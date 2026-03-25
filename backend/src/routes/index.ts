import { Router } from "express";

import { adminRouter } from "./admin.js";
import { assessmentRouter } from "./assessment.js";
import { reportRouter } from "./report.js";

const apiRouter = Router();

apiRouter.use("/assessment", assessmentRouter);
apiRouter.use("/report", reportRouter);
apiRouter.use("/admin", adminRouter);

export { apiRouter };
