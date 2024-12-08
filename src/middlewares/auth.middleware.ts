import { RoleType } from '../resources/users/user.Interface';
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken'

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

const JWT_SECRET: Secret = process.env.JWT_SECRET_KEY || ''
export const authenticateUser = (req: AuthUserRequest, res: Response, next: NextFunction) => {

    // Check if the authorization header contains a token
    const authHeader = req.rawHeaders.find((items) => items.startsWith('Bearer'));

    if (authHeader && authHeader.startsWith('Bearer')) {
        const [bearer, token] = authHeader.split(' ');

        if (!token.length) {
            return res.status(401).json({ message:'Authenticated users only'});
        }
        try {
            const decodedToken = jwt.verify(token, JWT_SECRET) as JwtPayload;
            const { username, userId, role } = decodedToken;
            // Attach the user information to the request object
            req.user = { username, userId, role } as AuthenticatedUser;
            if (!decodedToken) {
                return res.status(401).json({ message:'Authentication invalid, Please login again, if 2FA is enabled verify your 2FA'});
            };
            next();
        } catch (error) {
            console.log(error)
            return res.status(401).json({ message:'Please login again'});
        }
    } else {
        throw new Error('Please login again');
    }

};

export const authenticateUserCheckForAuthorizeTaggers = (req: AuthUserRequest, res: Response) => {

    const authHeader = req.rawHeaders.find((items) => items.startsWith('Bearer'));
    if (authHeader && authHeader.startsWith('Bearer')) {
        const [bearer, token] = authHeader.split(' ');

        if (!token.length) {
             return res.status(401).json({ message: 'Authenticated users only'});
        }
        try {
            const decodedToken = jwt.verify(token, JWT_SECRET) as JwtPayload;
            if (!decodedToken) {  return res.status(401).json({ message: 'Authentication invalid, Please login again, if 2FA is enabled verify your 2FA'}) };

            const { username, userId, role } = decodedToken;
            // Attach the user information to the request object
            req.user = { username, userId, role } as AuthenticatedUser;

            req;
        } catch (error) {
             return res.status(401).json({ message: 'Please login again'});
        }
    } else {
         return res.status(401).json({ message: 'Authenticated users only, Please login'});
    }


};
export const authorizeTaggersOrSuperAdmins = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Check if the user is authenticated
        const authReq:any = authenticateUserCheckForAuthorizeTaggers(req, res);

        if (!authReq.user) {
            return res.status(401).json({ message:'Authentication required, Please login and enable 2FA authentication'});
        }
        // Extract user role from the JWT payload
        const { role } = authReq.user;

        // Check if the user has the required role (Tagger or SuperAdmin)
        if (role !== RoleType.tagger || !['superAdmin', 'admin'].includes(role)) {
            return res.status(401).json({ message:'Unauthorized to access this route'});
        }

        next();
    } catch (error) {
        next(error);
    }
};


