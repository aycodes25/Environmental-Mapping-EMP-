import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { Request } from "express";

const getJwtSecret = (): Secret => {
	return process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || "default-secret-key";
};

export const generateSixDigitRandomNumber = (): string => {
	let randomNumber = "";
	for (let i = 0; i < 6; i++) {
		randomNumber += Math.floor(Math.random() * 10).toString();
	}
	return randomNumber;
};

export const generateFourDigitRandomNumber = (): string => {
	let randomNumber = "";
	for (let i = 0; i < 4; i++) {
		randomNumber += Math.floor(Math.random() * 10).toString();
	}
	return randomNumber;
};

export const checkIfAuthenticated = (req: Request) => {
	let token: string | null = null;
	const authHeader = req.headers.authorization || req.headers["authorization"];
	if (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
		token = authHeader.substring(7).trim();
	} else if (Array.isArray(req.rawHeaders)) {
		const raw = req.rawHeaders.find((item) => typeof item === "string" && item.toLowerCase().startsWith("bearer "));
		if (raw) {
			token = raw.substring(7).trim();
		}
	}

	if (!token) {
		return { authenticated: false };
	}

	try {
		const secret = getJwtSecret();
		const decodedToken = jwt.verify(token, secret) as JwtPayload;
		if (!decodedToken) {
			return { authenticated: false };
		}
		return { authenticated: true, user: decodedToken };
	} catch (error) {
		return { authenticated: false };
	}
};
