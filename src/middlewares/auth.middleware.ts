import { RoleType } from '../resources/users/user.Interface';
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';

// Define a custom interface for the user object stored in the request
interface AuthenticatedUser {
    username: string;
    userId: string;
    role: string;
}

// Extend the Request interface to include the user property
export interface AuthUserRequest extends Request {
    headers: any;
    user?: AuthenticatedUser;
}

const getJwtSecret = (): Secret => {
    return process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'default-secret-key';
};

const extractBearerToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization || req.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
        return authHeader.substring(7).trim();
    }
    if (Array.isArray(req.rawHeaders)) {
        const raw = req.rawHeaders.find((item) => typeof item === 'string' && item.toLowerCase().startsWith('bearer '));
        if (raw) {
            return raw.substring(7).trim();
        }
    }
    return null;
};

export const authenticateUser = (req: AuthUserRequest, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);

    if (!token) {
        return res.status(401).json({ message: 'Authenticated users only, Please login' });
    }

    try {
        const secret = getJwtSecret();
        const decodedToken = jwt.verify(token, secret) as JwtPayload;
        if (!decodedToken) {
            return res.status(401).json({ message: 'Authentication invalid, Please login again' });
        }
        const { username, userId, role } = decodedToken;
        req.user = { username, userId, role } as AuthenticatedUser;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Please login again' });
    }
};

export const authenticateUserCheckForAuthorizeTaggers = (req: AuthUserRequest, res: Response): AuthUserRequest | null => {
    const token = extractBearerToken(req);
    if (!token) {
        res.status(401).json({ message: 'Authenticated users only, Please login' });
        return null;
    }

    try {
        const secret = getJwtSecret();
        const decodedToken = jwt.verify(token, secret) as JwtPayload;
        if (!decodedToken) {
            res.status(401).json({ message: 'Authentication invalid, Please login again' });
            return null;
        }

        const { username, userId, role } = decodedToken;
        req.user = { username, userId, role } as AuthenticatedUser;
        return req;
    } catch (error) {
        res.status(401).json({ message: 'Please login again' });
        return null;
    }
};

export const authorizeTaggersOrSuperAdmins = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = authenticateUserCheckForAuthorizeTaggers(req as AuthUserRequest, res);
        if (!authReq || !authReq.user) {
            return; // Response already sent
        }

        const { role } = authReq.user;
        if (role !== RoleType.tagger && !['superAdmin', 'admin'].includes(role)) {
            return res.status(403).json({ message: 'Unauthorized to access this route' });
        }

        next();
    } catch (error) {
        next(error);
    }
};
