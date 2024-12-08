import { Response, NextFunction } from "express";
import incidentModel from "./incident.model";
import { AuthUserRequest } from "@/middlewares/auth.middleware";
import userModel from "../users/user.model";
import { RoleType } from "../users/user.Interface";


export class IncidentController {
    async createIncident(req: AuthUserRequest, res: Response, next: NextFunction) {
        const { name, description, } = req.body

        const userId = req.user?.userId;
        if (!userId) {
            // Handle case when user ID is not found
             return res.status(400).send({status: "error", message:'Please login again, User not found'});
        }

        // Fetch the user by ID
        const user = await userModel.findById(userId);
        if (!user) {
             return res.status(400).send({status: "error", message:'User not found'});
        }

        if (!name || !description) {
            return res.status(400).send({status: "error", message: 'name and description is required'});
        }
        const incident = await incidentModel.create({
            name,
            description,
            user: user
        })
        try {
            res.status(200).json({
                message: 'success',
                data: incident
            })
        } catch (error: any) {
            return { error: error.message };
        }
    }

    async updateIncident(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            // console.log(id);

            const { name, description } = req.body;

            const Incident = await incidentModel.findByIdAndUpdate(id, { name, description }, { new: true })
            res.status(200).json({
                message: 'Incideent updated successfully',
                data: Incident
            });
        } catch (error: any) {
            next(error.message); // Pass the error to the error handling middleware
        }
    }

    async getIncident(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {

            const userId = req.user?.userId;
            if (!userId) {
                // Handle case when user ID is not found
                 return res.status(400).send({status: "error", message:'Please login again, User not found'});
            }

            // Fetch the user by ID
            const user = await userModel.findById(userId);
            if (!user) {
                 return res.status(400).send({status: "error", message:'User not found'});
            }
            // console.log(user.locations)
            if (user.role === RoleType.superAdmin) {
                const incident = await incidentModel.find().populate('user', 'username email locations').exec();

                // Send the response
                res.status(200).json({
                    message: 'success',
                    data: incident
                });
           
             } else {
                const incident = await incidentModel.find().populate('user', 'username email locations').exec();

                // Send the response
                res.status(200).json({
                    message: 'success',
                    data: [...incident.filter((i: any) => i.user?.locations?.valueOf() === user?.locations?.valueOf())]
                });
             }
        } catch (error: any) {
            return { error: error.message };
        }
    }
    async deleteIncident(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {

            await incidentModel.findByIdAndDelete(req.params.id)

            res.status(200).json({
                message: 'success incident deleted',

            })
        } catch (error: any) {
            return { error: error.message };
        }
    }


}