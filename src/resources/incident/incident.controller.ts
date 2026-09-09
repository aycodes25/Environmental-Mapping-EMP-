import { Response, NextFunction } from "express";
import incidentModel from "./incident.model";
import { AuthUserRequest } from "@/middlewares/auth.middleware";
import userModel from "../users/user.model";
import { RoleType } from "../users/user.Interface";
import { toObjectId } from "../../utils/mongo";
import notificationService from "../notifications/notification.service";


export class IncidentController {
    async createIncident(req: AuthUserRequest, res: Response, next: NextFunction) {
        const { name, description, } = req.body

        const userId = req.user?.userId;
        if (!userId) {
             return res.status(400).send({status: "error", message:'Please login again, User not found'});
        }

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
            // --- NOTIFICATION: Incident reported ---
            // Notify Super Admin and Admin about new incident
            notificationService.notifyRoles(
                [RoleType.superAdmin, RoleType.admin],
                "Incident reported",
                `An incident "${name}" has been reported by ${user.fullname || user.username}.`,
                "Incident",
                incident._id
            ).catch(() => {});

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
            const { name, description } = req.body;

            const updatedIncident = await incidentModel.findByIdAndUpdate(id, { name, description }, { new: true })

            // --- NOTIFICATION: Incident updated ---
            // Notify Super Admin and Admin about incident update
            notificationService.notifyRoles(
                [RoleType.superAdmin, RoleType.admin, RoleType.reviewer],
                "Incident updated",
                `Incident "${name || 'record'}" has been updated.`,
                "Incident",
                updatedIncident?._id
            ).catch(() => {});

            res.status(200).json({
                message: 'Incident updated successfully',
                data: updatedIncident
            });
        } catch (error: any) {
            next(error.message);
        }
    }

    async getIncident(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                 return res.status(400).send({status: "error", message:'Please login again, User not found'});
            }

            const user = await userModel.findById(userId);
            if (!user) {
                 return res.status(400).send({status: "error", message:'User not found'});
            }
            if (user.role === RoleType.superAdmin) {
                const incident = await incidentModel.find().populate('user', 'username email locations').exec();
                res.status(200).json({
                    message: 'success',
                    data: incident
                });
           
             } else {
                const incident = await incidentModel.find().populate('user', 'username email locations').exec();
                const locationId = toObjectId(user?.locations);
                const filteredIncidents = locationId
                    ? incident.filter((i: any) => {
                        const incidentLocationId = toObjectId(i.user?.locations);
                        return Boolean(incidentLocationId && incidentLocationId.equals(locationId));
                    })
                    : [];

                res.status(200).json({
                    message: 'success',
                    data: filteredIncidents
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
