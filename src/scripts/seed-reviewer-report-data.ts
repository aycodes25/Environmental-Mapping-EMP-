import "dotenv/config";
import mongoose from "mongoose";
import userModel from "../resources/users/user.model";
import locationsModel from "../resources/locations/locations.models";
import modelModel from "../resources/models/model.model";
import tagsModel from "../resources/tags/tags.model";
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
const DEFAULT_MODEL_FILE_URL =
	process.env.SEED_MODEL_FILE_URL ||
	"https://example.com/models/sample-model.glb";
const DEFAULT_MODEL_COVER_URL =
	process.env.SEED_MODEL_COVER_URL ||
	"https://example.com/models/sample-cover.png";
const MIN_SAMPLING_REPORTS_PER_MODEL = 3;
const MIN_INCIDENT_REPORTS_PER_MODEL = 2;
const SAMPLE_TYPES = ["Water", "Air", "Soil", "Noise", "Dust"];
const INCIDENT_TYPES = [
	"Leak detected",
	"Equipment fault",
	"Safety breach",
	"Spill reported",
];
const ACTIONS = [
	"Notify supervisor",
	"Shutdown affected area",
	"Increase ventilation",
	"Deploy spill kit",
	"Request maintenance",
];
const NOTES = [
	"Routine audit completed.",
	"Requires follow-up sampling next week.",
	"Immediate corrective action assigned.",
	"Waiting on third-party lab confirmation.",
];

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
		console.log(`Found existing reviewer user ${REVIEWER_EMAIL}`);
	}

	return reviewer;
}

async function ensureLocations() {
	let locations = await locationsModel.find({});
	if (!locations.length) {
		const defaultLocation = await locationsModel.create({
			name: "Reviewer Seed Plant",
			description: "Auto-generated location for reviewer reports",
		});
		locations = [defaultLocation];
		console.log("Created fallback location for reviewer seeding");
	}
	return locations;
}

function buildReviewerSlug(locationId: string) {
	return `REVIEWER-SEED-${locationId}`;
}

async function ensureModelsForLocations(
	reviewerId: mongoose.Types.ObjectId,
	locations: Array<mongoose.Document & { _id: mongoose.Types.ObjectId; name: string }>
) {
	for (const location of locations) {
		const slug = buildReviewerSlug(location._id.toString());
		const existingModel = await modelModel.findOne({ slug });
		if (existingModel) {
			continue;
		}

		await modelModel.create({
			description: `Reviewer seed model for ${location.name}`,
			slug,
			file: DEFAULT_MODEL_FILE_URL,
			modelName: `${location.name} Review Facility`,
			coverPicture: DEFAULT_MODEL_COVER_URL,
			user: reviewerId,
			location: location._id,
			size: 0,
		});
		console.log(`Created reviewer seed model for location ${location.name}`);
	}

	return modelModel
		.find({ user: reviewerId })
		.populate("location")
		.exec();
}

async function ensureReviewerLocationAccess(
	reviewerId: mongoose.Types.ObjectId,
	locationIds: mongoose.Types.ObjectId[]
) {
	await userModel.updateOne(
		{ _id: reviewerId },
		{ $addToSet: { locations: { $each: locationIds } } }
	);
}

function randomFrom<T>(items: T[], seed: number) {
	return items[seed % items.length];
}

async function generateUniqueSlug(prefix: "R-SAM" | "R-INC") {
	let slug = "";
	let exists = true;
	while (exists) {
		const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
		slug = `${prefix}-${Date.now()}-${randomSuffix}`;
		exists = Boolean(await tagsModel.exists({ slug }));
	}
	return slug;
}

async function seedReviewerTagsForModel(
	model: mongoose.Document & {
		_id: mongoose.Types.ObjectId;
		modelName: string;
		location?: any;
	},
	reviewerId: mongoose.Types.ObjectId
) {
	const locationName = model?.location?.name || "Unknown Location";

	const sampleCount = await tagsModel.countDocuments({
		model: model._id,
		type: "sampling",
		user: reviewerId,
	});
	const incidentCount = await tagsModel.countDocuments({
		model: model._id,
		type: "incident",
		user: reviewerId,
	});

	const tagsToInsert: any[] = [];

	for (let i = sampleCount; i < MIN_SAMPLING_REPORTS_PER_MODEL; i++) {
		const slug = await generateUniqueSlug("R-SAM");
		tagsToInsert.push({
			objectName: `${model.modelName} sample batch ${i + 1}`,
			action: randomFrom(ACTIONS, i),
			locations: locationName,
			presence: i % 2 === 0 ? "negative" : "positive",
			sample: randomFrom(SAMPLE_TYPES, i + 1),
			user: reviewerId,
			model: model._id,
			text: randomFrom(NOTES, i),
			taggedInfo: `Reviewer sampling record ${i + 1} for ${model.modelName}`,
			type: "sampling",
			group: `Review-Group-${(i % 3) + 1}`,
			slug,
		});
	}

	for (let i = incidentCount; i < MIN_INCIDENT_REPORTS_PER_MODEL; i++) {
		const slug = await generateUniqueSlug("R-INC");
		tagsToInsert.push({
			objectName: `${model.modelName} incident ${i + 1}`,
			action: randomFrom(ACTIONS, i + 4),
			locations: locationName,
			user: reviewerId,
			model: model._id,
			text: randomFrom(NOTES, i + 2),
			taggedInfo: `Reviewer incident note ${i + 1} for ${model.modelName}`,
			type: "incident",
			incident: randomFrom(INCIDENT_TYPES, i),
			group: `Review-Incident-${i + 1}`,
			slug,
		});
	}

	if (!tagsToInsert.length) {
		return 0;
	}

	const inserted = await tagsModel.insertMany(tagsToInsert);
	await modelModel.updateOne(
		{ _id: model._id },
		{ $addToSet: { tags: { $each: inserted.map((tag) => tag._id) } } }
	);

	return inserted.length;
}

async function seedReviewerReports(
	reviewerId: mongoose.Types.ObjectId,
	models: Array<
		mongoose.Document & {
			_id: mongoose.Types.ObjectId;
			modelName: string;
			location?: any;
		}
	>
) {
	let total = 0;
	for (const model of models) {
		total += await seedReviewerTagsForModel(model, reviewerId);
	}
	return total;
}

async function run() {
	try {
		await connectToDatabase();
		const reviewer = await ensureReviewerUser();
		const locations = await ensureLocations();
		await ensureReviewerLocationAccess(
			reviewer._id,
			locations.map((loc) => loc._id)
		);

		const reviewerModels = await ensureModelsForLocations(reviewer._id, locations);
		const createdTags = await seedReviewerReports(reviewer._id, reviewerModels);

		console.log("\n✅ Reviewer report seed completed successfully!");
		console.log(`Locations available: ${locations.length}`);
		console.log(`Models prepared for reviewer: ${reviewerModels.length}`);
		console.log(`Tags created for reviewer reports: ${createdTags}`);
		console.log("\nLogin with:");
		console.log(`  Email: ${REVIEWER_EMAIL}`);
		console.log(`  Password: ${REVIEWER_PASSWORD}`);
	} catch (error) {
		console.error("Failed to seed reviewer report data:", error);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from database");
	}
}

run();


