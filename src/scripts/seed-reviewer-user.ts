import "dotenv/config";
import mongoose from "mongoose";
import userModel from "../resources/users/user.model";
import { RoleType } from "../resources/users/user.Interface";
import { hashPassword } from "../utils/hashed";

const REVIEWER_EMAIL =
	process.env.SEED_REVIEWER_EMAIL || "reviewer@environmental-mapping.test";
const REVIEWER_USERNAME =
	process.env.SEED_REVIEWER_USERNAME || "seed.reviewer";
const REVIEWER_FULLNAME =
	process.env.SEED_REVIEWER_FULLNAME || "Seed Reviewer";
const REVIEWER_PASSWORD =
	process.env.SEED_REVIEWER_PASSWORD || "reviewer123";

async function connectToDatabase() {
	const mongoUrl = process.env.MONGO_URL;
	if (!mongoUrl) {
		throw new Error("MONGO_URL is not defined. Please set it before seeding.");
	}
	await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 10000 });
	console.log("Connected to database");
}

async function ensureReviewerUser() {
	let reviewer = await userModel.findOne({ email: REVIEWER_EMAIL });

	if (!reviewer) {
		const hashedPassword = await hashPassword(REVIEWER_PASSWORD);
		reviewer = await userModel.create({
			username: REVIEWER_USERNAME,
			fullname: REVIEWER_FULLNAME,
			email: REVIEWER_EMAIL,
			password: hashedPassword,
			role: RoleType.reviewer,
			isVerified: true,
		});
		console.log(`Created reviewer user ${REVIEWER_EMAIL}`);
	} else {
		console.log(`Reviewer user ${REVIEWER_EMAIL} already exists`);
	}

	return reviewer;
}

async function run() {
	try {
		await connectToDatabase();
		await ensureReviewerUser();

		console.log("\n✅ Reviewer seed completed!");
		console.log("Login credentials:");
		console.log(`Email: ${REVIEWER_EMAIL}`);
		console.log(`Password: ${REVIEWER_PASSWORD}`);
	} catch (error) {
		console.error("Failed to seed reviewer user:", error);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from database");
	}
}

run();


