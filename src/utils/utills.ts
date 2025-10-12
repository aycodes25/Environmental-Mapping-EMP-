import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { Request } from "express";

const JWT_SECRET: Secret = process.env.JWT_SECRET_KEY || "";

/**@function generates 6 randon digits for reset password
 * @default '''
 * @returns randomNumbers
 */
export const generateSixDigitRandomNumber = (): string => {
	let randomNumber = "";
	for (let i = 0; i < 6; i++) {
		// Generate a random digit from 0 to 9 and append it to the randomNumber string
		randomNumber += Math.floor(Math.random() * 10).toString();
	}
	return randomNumber;
};

/**@function generates 4 randon digits for reset password
 * @default '''
 * @returns randomNumbers
 */
export const generateFourDigitRandomNumber = (): string => {
	let randomNumber = "";
	for (let i = 0; i < 4; i++) {
		// Generate a random digit from 0 to 9 and append it to the randomNumber string
		randomNumber += Math.floor(Math.random() * 10).toString();
	}
	return randomNumber;
};

export const checkIfAuthenticated = (req: Request) => {
	const authHeader = req.rawHeaders.find((items) =>
		items.startsWith("Bearer")
	);

	if (authHeader && authHeader.startsWith("Bearer")) {
		const [bearer, token] = authHeader.split(" ");

		if (!token || !token.length) {
			return { authenticated: false };
		}
		try {
			const decodedToken = jwt.verify(token, JWT_SECRET) as JwtPayload;
			if (!decodedToken) {
				return { authenticated: false };
			}
			return { authenticated: true };
		} catch (error) {
			return { authenticated: false };
		}
	} else {
		return { authenticated: false };
	}
};
