import "dotenv/config";
import mongoose from "mongoose";
import userModel from "../resources/users/user.model";
import locationsModel from "../resources/locations/locations.models";
import modelModel from "../resources/models/model.model";
import tagsModel from "../resources/tags/tags.model";
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
const MIN_SAMPLING_REPORTS_PER_MODEL = 4;
const MIN_INCIDENT_REPORTS_PER_MODEL = 2;
const SAMPLE_TYPES = ["Water", "Air", "Soil", "Noise", "Dust"];
const INCIDENT_TYPES = ["Leak detected", "Equipment fault", "Safety breach"];
const ACTIONS = [
    "Notify supervisor",
    "Shutdown affected area",
    "Increase ventilation",
    "Deploy spill kit",
];
const NOTES = [
    "Routine inspection completed successfully.",
    "Follow-up sampling recommended.",
    "Corrective action required within 24h.",
];

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

function randomFrom<T>(items: T[], index: number) {
    return items[index % items.length];
}

async function generateUniqueSlug(prefix: "SAM" | "INC") {
    let slug = "";
    let exists = true;
    while (exists) {
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        slug = `${prefix}-${Date.now()}-${randomSuffix}`;
        exists = Boolean(await tagsModel.exists({ slug }));
    }

    return slug;
}

async function seedTagsForModel(
    model: mongoose.Document & {
        _id: mongoose.Types.ObjectId;
        modelName: string;
        location?: any;
    },
    taggerId: mongoose.Types.ObjectId
) {
    const locationName = model?.location?.name || "Unassigned Location";

    const existingSampling = await tagsModel.countDocuments({
        model: model._id,
        type: "sampling",
    });
    const existingIncidents = await tagsModel.countDocuments({
        model: model._id,
        type: "incident",
    });

    const tagsToInsert: any[] = [];

    for (let i = existingSampling; i < MIN_SAMPLING_REPORTS_PER_MODEL; i++) {
        const slug = await generateUniqueSlug("SAM");
        tagsToInsert.push({
            objectName: `${model.modelName} sample ${i + 1}`,
            action: randomFrom(ACTIONS, i),
            locations: locationName,
            presence: i % 2 === 0 ? "negative" : "positive",
            sample: randomFrom(SAMPLE_TYPES, i),
            user: taggerId,
            model: model._id,
            text: randomFrom(NOTES, i),
            taggedInfo: `Seeded sampling run ${i + 1} for ${model.modelName}`,
            type: "sampling",
            group: `Group ${((i % 3) + 1).toString()}`,
            slug,
        });
    }

    for (let i = existingIncidents; i < MIN_INCIDENT_REPORTS_PER_MODEL; i++) {
        const slug = await generateUniqueSlug("INC");
        tagsToInsert.push({
            objectName: `${model.modelName} incident ${i + 1}`,
            action: randomFrom(ACTIONS, i + 3),
            locations: locationName,
            user: taggerId,
            model: model._id,
            text: randomFrom(NOTES, i + 1),
            taggedInfo: `Seeded incident report ${i + 1} for ${model.modelName}`,
            type: "incident",
            incident: randomFrom(INCIDENT_TYPES, i),
            group: `Incident-${i + 1}`,
            slug,
        });
    }

    if (!tagsToInsert.length) {
        return 0;
    }

    const createdTags = await tagsModel.insertMany(tagsToInsert);
    await modelModel.updateOne(
        { _id: model._id },
        { $addToSet: { tags: { $each: createdTags.map((tag) => tag._id) } } }
    );

    return createdTags.length;
}

async function seedReportsForTaggerModels(taggerId: mongoose.Types.ObjectId) {
    const models = await modelModel.find({ user: taggerId }).populate("location").exec();

    if (!models.length) {
        console.warn("No models found for the tagger. Skipping report seeding.");
        return 0;
    }

    let totalCreated = 0;
    for (const model of models) {
        totalCreated += await seedTagsForModel(model, taggerId);
    }

    return totalCreated;
}

async function run() {
	try {
		await connectToDatabase();
		const tagger = await ensureTaggerUser();
		const locationCount = await ensureModelsForLocations(tagger._id);
        const reportsCreated = await seedReportsForTaggerModels(tagger._id);

		console.log(
			`Tagger ${TAGGER_EMAIL} now has visibility over ${locationCount} locations.`
		);
		console.log(
			"Seed models have been created per location (only if missing), so the Location Distribution chart should have data."
		);
        console.log(
            `Seeded ${reportsCreated} report${reportsCreated === 1 ? "" : "s"
            } so the tagger has immediate data in the Report screen.`
        );
	} catch (error) {
		console.error("Failed to seed tagger data:", error);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
	}
}

run();


