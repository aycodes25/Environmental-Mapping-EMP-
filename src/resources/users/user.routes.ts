import { Router } from "express";
import { UserController } from "./users.controller";
import multer from "multer";
import {
	authenticateUser,
	// authorizeTaggersOrSuperAdmins
} from "../../middlewares/auth.middleware";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const fields = upload.fields([{ name: "image", maxCount: 1 }]);
export class UserRoute {
	path = "/user";
	router = Router();
	private userController = new UserController();

	constructor() {
		this.initialiseRoutes();
	}

	private initialiseRoutes(): void {
		/**
		 * @POST v1/user/register
		 * @DESC register a customer
		 */
		this.router.post(
			`${this.path}/register`,
			fields,
			this.userController.signUpTagger
		);

		/**
		 * @POST v1/user/register
		 * @DESC register a customer
		 */
		this.router.get(
			`${this.path}/seed-super-admin`,
			fields,
			this.userController.seedSuperAdmin
		);

		this.router.get(
			`${this.path}/check-authenticated`,
			this.userController.CheckIfAuthenticated
		);

		/**
		 * @POST v1/user/login
		 * @DESC login a user
		 */
		this.router.post(`${this.path}/login`, this.userController.LoginAdmin);
		/**
		 * @POST /user/register-tagger
		 * @DESC register a customer
		 */
		this.router.post(
			`${this.path}/register-tagger`,
			fields,
			this.userController.signUpTagger
		);

		/**
		 * @POST /user/getUser
		 * @DESC register a customer
		 */
		this.router.get(
			`${this.path}/getusers`,
			authenticateUser,
			this.userController.getUsers
		);
		/**
		 * @POST /user/get-a-user
		 * @DESC register a customer
		 */
		this.router.get(
			`${this.path}/get-a-user/:id`,
			authenticateUser,
			this.userController.getAUser
		);
		/**
		 * @Put /user/updateuser/:id
		 * @DESC register a customer
		 */
		this.router.put(
			`${this.path}/update-user/:id`,
			fields,
			authenticateUser,
			this.userController.updateAUser
		);

		/**
		 * @Delete /user/delete/:id
		 * @DESC delete a customer
		 */
		this.router.delete(
			`${this.path}/delete/:id`,
			authenticateUser,
			this.userController.deleteUser
		);
		/**
		 * @Post /user/send-2FAverification-token/
		 * @DESC  customer 2Fa token route
		 */
		this.router.post(
			`${this.path}/set-two-factor-auth-verification-method`,
			this.userController.twoFA
		);
		/**
		 * @Post /user/send-2FAverification-token/
		 * @DESC  customer 2Fa token route
		 */
		this.router.post(
			`${this.path}/send-reset-verification-token`,
			this.userController.requestPasswordReset
		);
		/**
		 * @Post /user/verifyToken/
		 * @DESC  customer verify forgot password token
		 */
		this.router.post(
			`${this.path}/two-factor-auth-verification-token`,
			this.userController.twoFAverifyToken
		);
		/**
		 * @Post /user/verifyToken/
		 * @DESC  customer verify forgot password token
		 */
		this.router.post(
			`${this.path}/reset-password-verification-token`,
			this.userController.resetPasswordVerifyToken
		);
		/**
		 * @Put /user/update-password/
		 * @DESC  customer to update password
		 */
		this.router.put(
			`${this.path}/update-password`,
			this.userController.updatePassword
		);
		/**
		 * @Get /user/dashboard/
		 * @DESC  dashboard route
		 */
		this.router.get(
			`${this.path}/dashboard`,
			authenticateUser,
			this.userController.dashboard
		);

		this.router.get(
			`${this.path}/dashboard-by-location/:locationId`,
			authenticateUser,
			this.userController.dashboardByLocation
		);
	}
}
