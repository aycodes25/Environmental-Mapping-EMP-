import "dotenv/config";
import mongoose from "mongoose";
import userModel from "../resources/users/user.model";
import locationsModel from "../resources/locations/locations.models";
import modelModel from "../resources/models/model.model";
import { RoleType } from "../resources/users/user.Interface";
import { hashPassword } from "../utils/hashed";

const TAGGER_EMAIL =
	process.env.SEED_TAGGER_EMAIL || "tagger@environmental-mapping.test";
const TAGGER_USERNAME =
	process.env.SEED_TAGGER_USERNAME || "seed.tagger";
const TAGGER_FULLNAME =
	process.env.SEED_TAGGER_FULLNAME || "Seed Tagger";
const TAGGER_PASSWORD =
	process.env.SEED_TAGGER_PASSWORD || "tagger123";
const DEFAULT_MODEL_FILE_URL =
	process.env.SEED_MODEL_FILE_URL ||
	"https://example.com/models/sample-model.glb";
const DEFAULT_MODEL_COVER_URL =
	process.env.SEED_MODEL_COVER_URL ||
	"https://example.com/models/sample-cover.png";

async function connectToDatabase() {
	const mongoUrl = process.env.MONGO_URL;
	if (!mongoUrl) {
		throw new Error("MONGO_URL is not defined. Please set it before seeding.");
	}
	await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 10000 });
}

async function ensureTaggerUser() {
	let tagger = await userModel.findOne({ email: TAGGER_EMAIL });

	if (!tagger) {
		const hashedPassword = await hashPassword(TAGGER_PASSWORD);
		tagger = await userModel.create({
			username: TAGGER_USERNAME,
			fullname: TAGGER_FULLNAME,
			email: TAGGER_EMAIL,
			password: hashedPassword,
			role: RoleType.tagger,
			isVerified: true,
		});
		console.log(`Created tagger user ${TAGGER_EMAIL}`);
	} else {
		console.log(`Found existing tagger user ${TAGGER_EMAIL}`);
	}

	return tagger;
}

function buildSeedSlug(locationId: string) {
	return `SEED-TAGGER-${locationId}`;
}

async function ensureModelsForLocations(taggerId: mongoose.Types.ObjectId) {
	const locations = await locationsModel.find({});

	if (!locations.length) {
		throw new Error("No locations found. Please seed locations first.");
	}

	const locationIds = locations.map((location) => location._id);
	await userModel.updateOne(
		{ _id: taggerId },
		{ $set: { locations: locationIds } }
	);

	for (const location of locations) {
		const slug = buildSeedSlug(location._id.toString());
		const existingModel = await modelModel.findOne({ slug });

		if (existingModel) {
			continue;
		}

		await modelModel.create({
			description: `Seed model for ${location.name}`,
			slug,
			file: DEFAULT_MODEL_FILE_URL,
			modelName: `${location.name} Facility`,
			coverPicture: DEFAULT_MODEL_COVER_URL,
			user: taggerId,
			location: location._id,
			size: 0,
		});
		console.log(`Created seed model for location ${location.name}`);
	}

	return locations.length;
}

async function run() {
	try {
		await connectToDatabase();
		const tagger = await ensureTaggerUser();
		const locationCount = await ensureModelsForLocations(tagger._id);

		console.log(
			`Tagger ${TAGGER_EMAIL} now has visibility over ${locationCount} locations.`
		);
		console.log(
			"Seed models have been created per location (only if missing), so the Location Distribution chart should have data."
		);
	} catch (error) {
		console.error("Failed to seed tagger data:", error);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
	}
}

run();

