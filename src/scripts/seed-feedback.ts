import "dotenv/config";
import mongoose from "mongoose";
import FeedbackModel, { FeedbackStatus } from "../resources/feedback/feedback.model";
import userModel from "../resources/users/user.model";

const seedFeedback = async () => {
	try {
		// Connect to MongoDB
		const { MONGO_URL } = process.env;
		if (!MONGO_URL) {
			throw new Error("MONGO_URL is not defined in environment variables");
		}

		await mongoose.connect(MONGO_URL, {
			serverSelectionTimeoutMS: 10000,
		});
		console.log("Connected to MongoDB");

		// Get some users from the database
		const users = await userModel.find().limit(5);
		if (users.length === 0) {
			console.log("No users found in database. Please create users first.");
			await mongoose.disconnect();
			return;
		}

		// Sample feedback messages
		const feedbackMessages = [
			{
				message: "The dashboard could use more visualizations. It would be helpful to see trends over time with charts and graphs.",
				status: FeedbackStatus.pending,
			},
			{
				message: "I've noticed that the search functionality on the models page is sometimes slow when filtering large datasets. Could we optimize this?",
				status: FeedbackStatus.pending,
			},
			{
				message: "The report generation feature works great! However, it would be nice to have an option to export reports in different formats like Excel or CSV.",
				status: FeedbackStatus.reviewed,
			},
			{
				message: "The user interface is clean and intuitive. Great job on the design!",
				status: FeedbackStatus.resolved,
			},
			{
				message: "I encountered an issue when uploading large files. The upload fails for files larger than 10MB. Can we increase the file size limit or add better error handling?",
				status: FeedbackStatus.pending,
			},
			{
				message: "The notification system is working well. It keeps me informed about important updates.",
				status: FeedbackStatus.reviewed,
			},
			{
				message: "Would it be possible to add keyboard shortcuts for common actions? This would improve productivity for power users.",
				status: FeedbackStatus.pending,
			},
			{
				message: "The mobile responsiveness could be improved. Some forms are difficult to use on smaller screens.",
				status: FeedbackStatus.reviewed,
			},
			{
				message: "I love the new feedback feature! It's easy to use and the interface is well-designed.",
				status: FeedbackStatus.resolved,
			},
			{
				message: "The pagination on the tables works smoothly. No issues there!",
				status: FeedbackStatus.resolved,
			},
			{
				message: "Could we add a dark mode option? It would be easier on the eyes during long work sessions.",
				status: FeedbackStatus.pending,
			},
			{
				message: "The data export feature is very useful. Thank you for implementing it!",
				status: FeedbackStatus.reviewed,
			},
		];

		// Create feedback entries
		const feedbackPromises = feedbackMessages.map((feedback, index) => {
			// Distribute feedback across available users
			const user = users[index % users.length];
			return FeedbackModel.create({
				user: user._id,
				message: feedback.message,
				status: feedback.status,
			});
		});

		await Promise.all(feedbackPromises);
		console.log(`Successfully seeded ${feedbackMessages.length} feedback entries`);

		// Display summary
		const summary = await FeedbackModel.aggregate([
			{
				$group: {
					_id: "$status",
					count: { $sum: 1 },
				},
			},
		]);

		console.log("\nFeedback Summary:");
		summary.forEach((item) => {
			console.log(`  ${item._id}: ${item.count}`);
		});

		await mongoose.disconnect();
		console.log("\nDisconnected from MongoDB");
	} catch (error) {
		console.error("Error seeding feedback:", error);
		await mongoose.disconnect();
		process.exit(1);
	}
};

// Run the seed function
seedFeedback();

