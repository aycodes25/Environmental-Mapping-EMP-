import { Response, NextFunction, Request } from "express";
import { getFileFromDisk } from "../../utils/aws/aws";

export class FilesController {
    async getFile(req: Request, res: Response, next: NextFunction) {
        try {
            let filename = req.params.filename
            let file = await getFileFromDisk(filename)
            res.status(200).send(file)
        } catch (error: any) {
            console.log(error)
            return { error: error.message };
        }
    }
}

