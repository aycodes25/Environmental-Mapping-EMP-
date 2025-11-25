import "dotenv/config";
import mongoose from "mongoose";
import userModel from "../resources/users/user.model";
import locationsModel from "../resources/locations/locations.models";
import modelModel from "../resources/models/model.model";
import { RoleType } from "../resources/users/user.Interface";
import { hashPassword } from "../utils/hashed";

const DEFAULT_MODEL_FILE_URL =
    process.env.SEED_MODEL_FILE_URL ||
    "https://example.com/models/sample-model.glb";
const DEFAULT_MODEL_COVER_URL =
    process.env.SEED_MODEL_COVER_URL ||
    "https://res.cloudinary.com/diqqf3eq2/image/upload/v1595959131/person-3_rxtqvi.jpg";

// Number of deleted models to create for testing pagination
const NUM_DELETED_MODELS = 15;

async function connectToDatabase() {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
        throw new Error("MONGO_URL is not defined. Please set it before seeding.");
    }
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 10000 });
    console.log("Connected to database");
}

async function getOrCreateUser() {
    // Try to find an existing admin or superAdmin user
    let user = await userModel.findOne({
        role: { $in: [RoleType.admin, RoleType.superAdmin] },
    });

    if (!user) {
        // If no admin exists, try to find any user
        user = await userModel.findOne({});
    }

    if (!user) {
        // Create a test admin user if none exists
        const hashedPassword = await hashPassword("test123");
        user = await userModel.create({
            username: "seed-admin",
            fullname: "Seed Admin",
            email: "seed-admin@test.com",
            password: hashedPassword,
            role: RoleType.admin,
            isVerified: true,
        });
        console.log("Created seed admin user");
    } else {
        console.log(`Using existing user: ${user.email}`);
    }

    return user;
}

async function getOrCreateLocation() {
    // Try to find an existing location
    let location = await locationsModel.findOne({});

    if (!location) {
        // Create a test location if none exists
        location = await locationsModel.create({
            name: "Seed Test Location",
            description: "Test location for deleted models seed data",
        });
        console.log("Created seed location");
    } else {
        console.log(`Using existing location: ${location.name}`);
    }

    return location;
}

async function addLocationToTaggers(locationId: mongoose.Types.ObjectId) {
    const result = await userModel.updateMany(
        {
            role: RoleType.tagger,
            $or: [{ locations: { $exists: false } }, { locations: { $ne: locationId } }],
        },
        { $addToSet: { locations: locationId } }
    );

    if (result.modifiedCount) {
        console.log(
            `Added location to ${result.modifiedCount} tagger${result.modifiedCount > 1 ? "s" : ""}`
        );
    } else {
        console.log("No taggers updated (either none exist or already had the location)");
    }
}

async function createDeletedModels(
    userId: mongoose.Types.ObjectId,
    locationId: mongoose.Types.ObjectId
) {
    // Check how many deleted models already exist
    const existingDeletedCount = await modelModel.countDocuments({ delete: true });
    console.log(`Found ${existingDeletedCount} existing deleted models`);

    // Create new deleted models
    const modelsToCreate = [];
    const baseTimestamp = Date.now();
    for (let i = 1; i <= NUM_DELETED_MODELS; i++) {
        // Generate unique slug with timestamp and random component
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const slug = `DELETED-FAC-${baseTimestamp}-${i}-${randomSuffix}`;

        // Check if this slug already exists
        const existing = await modelModel.findOne({ slug });
        if (existing) {
            console.log(`Skipping ${slug} - already exists`);
            continue;
        }

        modelsToCreate.push({
            description: `Test Deleted Facility ${i} - This is a seed model for testing pagination`,
            slug,
            file: DEFAULT_MODEL_FILE_URL,
            modelName: `Deleted Test Facility ${i}`,
            coverPicture: DEFAULT_MODEL_COVER_URL,
            user: userId,
            location: locationId,
            size: 0,
            delete: true, // Mark as deleted
        });
    }

    if (modelsToCreate.length > 0) {
        await modelModel.insertMany(modelsToCreate);
        console.log(`Created ${modelsToCreate.length} deleted models`);
    } else {
        console.log("No new deleted models to create");
    }

    return modelsToCreate.length;
}

async function run() {
    try {
        await connectToDatabase();
        const user = await getOrCreateUser();
        const location = await getOrCreateLocation();
        await addLocationToTaggers(location._id);

        // --------------------------------
        // FIXED LOGIC: Handle ObjectId | ObjectId[] safely
        // --------------------------------
        const userLocations = Array.isArray(user.locations)
            ? user.locations
            : user.locations
            ? [user.locations]
            : [];

        if (!userLocations.includes(location._id)) {
            await userModel.updateOne(
                { _id: user._id },
                { $addToSet: { locations: location._id } }
            );
            console.log("Added location to user's allowed locations");
        }

        const createdCount = await createDeletedModels(user._id, location._id);
        const totalDeleted = await modelModel.countDocuments({ delete: true });

        console.log("\n✅ Seed completed successfully!");
        console.log(`Created ${createdCount} new deleted models`);
        console.log(`Total deleted models in database: ${totalDeleted}`);
        console.log("\nYou can now test pagination on the Deleted Facilities page.");
    } catch (error) {
        console.error("Failed to seed deleted models:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from database");
    }
}

run();
