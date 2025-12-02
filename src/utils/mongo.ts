import { Types } from "mongoose";

export const toObjectId = (value?: any): Types.ObjectId | undefined => {
	if (!value) return undefined;
	if (value instanceof Types.ObjectId) return value;
	if (typeof value === "string" && Types.ObjectId.isValid(value)) {
		return new Types.ObjectId(value);
	}
	if (typeof value === "object" && value?._id) {
		return toObjectId(value._id);
	}
	return undefined;
};

export const toObjectIdArray = (value?: any): Types.ObjectId[] => {
	if (!value) return [];
	if (Array.isArray(value)) {
		return value
			.map((item) => toObjectId(item))
			.filter((id): id is Types.ObjectId => Boolean(id));
	}
	const single = toObjectId(value);
	return single ? [single] : [];
};

