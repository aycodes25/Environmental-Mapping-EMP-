import AWS from "aws-sdk";
import fsPromises from "fs/promises";

// const AwsaccessKeyId = process.env.AWS_ACCESS_KEY_ID
// const AwssecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: "us-east-1", // specify your region
});

const S3_BUCKET_NAME = "emp-bucket-new";

interface UploadResult {
	modelUrl: string;
	coverPhotoUrl: string;
}

export async function saveToDisk(fileContent: any, name: string) {
	let nameParts = name.split("/");
	name = nameParts[nameParts.length - 1]; // take only the file name
	let fileName = `${__dirname}/${name}`;
	let res = "";
	await fsPromises
		.writeFile(fileName, fileContent)
		.then(() => {
			res = `api/file/${name}`;
		})
		.catch((err) => {
			res = "";
			console.error(err);
		});
	return res;
}

export async function getFileFromDisk(fileName: string): Promise<Buffer> {
	let res: Buffer;
	fileName = `${__dirname}/${fileName}`;
	res = await fsPromises
		.readFile(fileName)
		.then((content) => {
			return content;
		})
		.catch((err) => {
			console.error(err);
			let emptyBuffer = Buffer.alloc(0);
			return emptyBuffer;
		});
	return res;
}

export async function deleteFileFromDisk(fileName: string): Promise<boolean> {
	let res = false;
	fileName = `${__dirname}/${fileName}`;
	await fsPromises
		.rm(fileName)
		.then(() => {
			res = true;
		})
		.catch(console.error);
	return res;
}

// Controller function to handle file uploads and AWS S3 upload
export const uploadFilesToS3 = async (
	modelFile: any,
	coverPhotoFile: any,
	imageKey: string,
	modelkey: string
): Promise<UploadResult> => {
	try {
		const s3 = new AWS.S3({
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			region: "us-east-1",
		});
		const modelUploadParams = {
			Bucket: S3_BUCKET_NAME!,
			Key: modelkey,
			Body: modelFile,
		};

		const coverPhotoUploadParams = {
			Bucket: S3_BUCKET_NAME!,
			Key: imageKey,
			Body: coverPhotoFile,
		};
		const modelUploadResult = await s3.upload(modelUploadParams).promise();
		const modelUrl = modelUploadResult.Location!;

		if (!coverPhotoFile) {
			return { modelUrl, coverPhotoUrl: "" };
		}

		// Upload cover photo file to AWS S3
		const coverPhotoUploadResult = await s3
			.upload(coverPhotoUploadParams)
			.promise();
		const coverPhotoUrl = coverPhotoUploadResult.Location!;
		// await Promise.all([
		//     s3.upload(modelUploadParams).promise(),
		//     s3.upload(coverPhotoUploadParams).promise()
		// ]);

		// // Upload model file to AWS S3
		// const modelUrl = `https://YOUR_S3_BUCKET_NAME.s3.amazonaws.com/${modelkey}`;
		// const coverPhotoUrl = `https://YOUR_S3_BUCKET_NAME.s3.amazonaws.com/${imageKey}`;

		// // Upload cover photo file to AWS S3

		// console.log({modelUrl:modelUrl, coverPhotoUrl:coverPhotoUrl})
		return { modelUrl, coverPhotoUrl };
	} catch (error: any) {
		throw new Error(error);
	}
};
export const UploadEvidenceToS3 = async (
	imageFile: any,
	evidenceKey: string
): Promise<any> => {
	try {
		const s3 = new AWS.S3({
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			region: "us-east-1",
		});
		const UploadParams = {
			Bucket: S3_BUCKET_NAME!,
			Key: evidenceKey,
			Body: imageFile,
		};

		const UploadResult = await s3.upload(UploadParams).promise();
		const evidenceUrl = UploadResult.Location!;

		return evidenceUrl;
	} catch (error: any) {
		throw new Error(error);
	}
};

export const UploadGtag = async (
	imageFile: any,
	evidenceKey: string
): Promise<any> => {
	try {
		const s3 = new AWS.S3({
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			region: "us-east-1",
		});

		const UploadParams = {
			Bucket: S3_BUCKET_NAME!,
			Key: evidenceKey,
			Body: imageFile,
		};

		const UploadResult = await s3.upload(UploadParams).promise();
		const evidenceUrl = UploadResult.Location!;

		return evidenceUrl;
	} catch (error: any) {
		throw new Error(error);
	}
};
export const UploadSampleToS3 = async (
	imageFile: any,
	imageKey: string
): Promise<any> => {
	try {
		const s3 = new AWS.S3({
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			region: "us-east-1",
		});
		const UploadParams = {
			Bucket: S3_BUCKET_NAME!,
			Key: imageKey,
			Body: imageFile,
		};

		const UploadResult = await s3.upload(UploadParams).promise();
		const evidenceUrl = UploadResult.Location!;

		return evidenceUrl;
	} catch (error: any) {
		throw new Error(error);
	}
};
export const UploadUserToS3 = async (
	imageFile: any,
	imageKey: string
): Promise<any> => {
	try {
		//  console.log('AWS Access Key:', process.env.AWS_ACCESS_KEY_ID);
		//  console.log('AWS Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY);
		// console.log('S3 Bucket Name:', process.env.S3_BUCKET_NAME);

		const s3 = new AWS.S3({
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			region: "us-east-1",
		});
		const UploadParams = {
			Bucket: S3_BUCKET_NAME!,
			Key: imageKey,
			Body: imageFile,
		};

		console.log("Uploading to AWS with params:", UploadParams);

		const UploadResult = await s3.upload(UploadParams).promise();
		const evidenceUrl = UploadResult.Location!;
		console.log(evidenceUrl);

		return evidenceUrl;
	} catch (error: any) {
		throw new Error(error);
	}
};

/**
 * Deletes an object from AWS S3 bucket.
 * @param {string} key - The key of the object to delete.
 * @returns {Promise<void>} - A promise that resolves once the object is deleted.
 */
export async function deleteObjectFromS3(key: string): Promise<void> {
	const extractedKey = extractAWSKeyFromCoverPhotoUrl(key);
	const params = {
		Bucket: S3_BUCKET_NAME!, // Specify your bucket name
		Key: key, // Specify the key of the object to delete
	};

	await s3.deleteObject(params).promise();
}

/**
 * Extracts the AWS key from a cover photo URL.
 * @param {string} coverPhotoUrl - The URL of the cover photo.
 * @returns {string | null} - The AWS key if found, otherwise null.
 */
export function extractAWSKeyFromCoverPhotoUrl(
	coverPhotoUrl: string
): string | null {
	// Split the URL by '/'
	const urlParts = coverPhotoUrl.split("/");

	// Find the index of 'coverPhoto' in the URL parts
	const coverPhotoIndex = urlParts.indexOf("coverPhoto");

	// If 'coverPhoto' is found and there are at least two more parts after it
	if (coverPhotoIndex !== -1 && coverPhotoIndex < urlParts.length - 2) {
		// Concatenate the parts after 'coverPhoto' to form the AWS key
		return urlParts.slice(coverPhotoIndex + 1).join("/");
	}

	// Return null if the AWS key cannot be extracted
	return null;
}
