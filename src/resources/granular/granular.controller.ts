import { saveToDisk, UploadEvidenceToS3, UploadGtag, UploadSampleToS3 } from "../../utils/aws/aws";
import { Request, Response, NextFunction } from "express";
import modelModel from "../models/model.model";
import GtagModels from "./granular.model.ts";
import { AuthUserRequest } from "@/middlewares/auth.middleware";


export class GtagController {
    async createGtag(req: AuthUserRequest, res: Response, next: NextFunction) {
        const { model, objectName, taggedInfo, user } = req.body
        const files = req.files;
        if (!files) {
            return res.status(400).send({ status: "error", message: 'file  not found' });
        }



        // console.log(files);
        // let imagePath: string | undefined = undefined;
        let Gtag
        let imageUrl = ''
        let imageFile
        //console.log(files, req.body);

        if (!model || !objectName || !user) {
            return res.status(400).send({ status: "error", message: 'check user,objectName or model is required' });
        }

        if (typeof files === 'object' && files !== null && 'image' in files && Array.isArray(files['image'])) {
            imageFile = files['image'][0];

        }

        const Model = await modelModel.findById(model)

        if (!Model) {
            return res.status(400).send({ status: "error", message: 'model not found' });
        }
        const imageData = imageFile?.buffer
        const imageFileName = imageFile?.originalname
        const imageKey = `GTag/${Model.modelName}/${imageFileName}`;

        if (!imageKey || !imageData) {
            return res.status(400).send({ status: "error", message: 'file cannot be read or uploaded to aws' });
        }
        //console.log(imageData, imageKey);

        imageUrl = await (async () => {
            if (process.env.NODE_ENV === "development") {
                let evidenceUrl = await saveToDisk(imageData, imageKey)
                return evidenceUrl
            }
            return UploadGtag(imageData, imageKey)
        })()

        Gtag = await GtagModels.create({
            userId: user,
            objectName,
            taggedInfo,
            modelId: model,
            image: imageUrl
        })
        Model?.gTags.push((await Gtag).id)

        await Model?.save()
        try {
            res.status(200).json({
                message: 'success',
                data: Gtag
            })
        } catch (error: any) {
            return { error: error.message };
        }
    }
    async deleteSample(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {

            await GtagModels.findByIdAndDelete(req.params.id)

            res.status(200).json({
                message: 'success Gtag  deleted',

            })
        } catch (error: any) {
            return { error: error.message };
        }
    }
}