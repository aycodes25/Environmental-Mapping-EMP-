import bcrypt from 'bcryptjs'
import aws from 'aws-sdk'
import UserSchema from "./user.model"
import * as speakeasy from 'speakeasy';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import userModel from './user.model';
import { sendResetPasswordEmail, sendVerifyEmail } from '../../utils/mail/mailer';

import User, { RoleType } from './user.Interface';
import locationsModels from '../locations/locations.models';
import mongoose from 'mongoose';
dotenv.config();

const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
    apiVersion: '2006-03-01',
    signatureVersion: 'v4',
});

const S3_BUCKET_NAME = process.env.AWS_BUCKET;

export const signUpAdmin = async (
    email: string,
    password: string,
    username: string,
    photoFile: any,
    fullname: any
): Promise<any> => {
    try {

        const emailAlreadyExists = await UserSchema.findOne({ email });
        if (emailAlreadyExists) {
            throw new Error("email already exists")
        }

        let photoUrl = '';
        if (photoFile) {
            const bucketName = process.env.S3_BUCKET_NAME;
            if (!bucketName) {
                throw new Error('S3_BUCKET_NAME environment variable is not defined');
            }

            const photoKey = `UserPhotos/${username}/coverPhotos`;
            const uploadModelParams = {
                Bucket: bucketName,
                Key: photoKey,
                Body: photoFile,
            };

            try {
                await s3.upload(uploadModelParams).promise();
                // console.log('upload to s3');
                photoUrl = `https://${bucketName}.s3.amazonaws.com/${photoKey}`;
            } catch (error) {
                console.error('Failed to upload image to AWS:', error);
                throw new Error('Failed to upload image');
            }
        }


        const HashPassword = await hashPassword(password);

        const user = await UserSchema.create({
            username,
            fullname,
            imageUrl: photoUrl,
            password: HashPassword,
            email,
            role: "superAdmin",
        });
        // const verificationToken = await generateVerificationToken(user);
        // await sendVerifyEmail(user.email, verificationToken)
        return { user };

    } catch (err: any) {
        if (err instanceof mongoose.Error.ValidationError) {
            throw new Error('Validation error');
        } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
            throw new Error('Document not found');
        } else if (err instanceof Error && (err as any).code === 11000) {
            const keyPattern = (err as any).keyPattern;
            if (keyPattern.username) {
                throw new Error('Username already exists');
            } else if (keyPattern.email) {
                throw new Error('Email already exists');
            } else {
                throw new Error('Duplicate key error');
            }
        } else {
            throw new Error(`Server error: ${err.message}`);
        }
    }
}
export const Login = async (
    email: string,
    password: string,
): Promise<any> => {
    try {
        if (!email || !password) {

            throw new Error('missing  credentials');
        }
        const user = await UserSchema.findOne({ email: email }).select('+password').populate("locations");
        // Check if user exists
        if (!user) {
            throw new Error('Incorrect credentials');
        }

        if (user.password) {
            const isPasswordValid = await comparePasswords(password, user.password);
            // Check if password is valid
            if (!isPasswordValid) {
                throw new Error('Incorrect credentials');
            } else {
                if (!user.twoFactorAuth.enabled) {
                    const token = await generateJwtToken(user);
                    const user_without_password = await UserSchema.findOne({ email: email }).populate("locations")
                    return { user: user_without_password, accessToken: token };
                } else {
                    return user;
                }
            }

        } else {
            throw new Error('Please contact the administrator and error just occurred');
        }


    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }
}
export const signUpTagger = async (
    email: string,
    password: string,
    username: string,
    role: string,
    imageUrl: string,
    fullname: any,
    location: string

): Promise<any> => {
    try {
        // Convert email and username to lowercase
        email = email.toLowerCase();
        username = username.toLowerCase();
        // password = password.toLowerCase();

        // Check if email already exists
        const emailAlreadyExists = await UserSchema.findOne({ email: email });
        if (emailAlreadyExists) {
            throw new Error("Email has been taken!");
        }

        // Check if username already exists
        const usernameAlreadyExists = await UserSchema.findOne({ username: username });
        if (usernameAlreadyExists) {
            throw new Error("Username has been taken!");
        }

        const locations = await locationsModels.findById(location)

        // check - why do we need location for this and in user schema?
        if (!locations) {
            throw new Error("Location doesnt exist!");
        }

        const HashPassword = await hashPassword(password);
        // console.log(HashPassword);

        const user = await UserSchema.create({
            username,
            fullname,
            imageUrl,
            password: HashPassword,
            email,
            role: role,
            locations: location
        });
        // const verificationToken = await generateVerificationToken(user);
        // await sendVerifyEmail(user.email, verificationToken)
        return user;

    } catch (err: any) {
        if (err instanceof mongoose.Error.ValidationError) {
            throw new Error('Validation error');
        } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
            throw new Error('Document not found');
        } else if (err instanceof Error && (err as any).code === 11000) {
            const keyPattern = (err as any).keyPattern;
            if (keyPattern.username) {
                throw new Error('Username already exists');
            } else if (keyPattern.email) {
                throw new Error('Email already exists');
            } else {
                throw new Error('Duplicate key error');
            }
        } else {
            throw new Error(`Server error: ${err.message}`);
        }
    }
}
export const updatePassword = async (
    email: string,
    password: string,
): Promise<any> => {
    try {
        const user = await UserSchema.findOne({ email });
        if (!user) {
            throw new Error("this email is invalid")
        }
        const HashPassword = await hashPassword(password);

        user.password = HashPassword
        await user.save()
        return user
    } catch (error: any) {
        throw new Error(error.message);

    }
}

// export const signUpReviewer = async (
//     email: string,
//     password: string,
//     username: string
// ): Promise<any> => {
//     try {
//         const emailAlreadyExists = await UserSchema.findOne({ email });
//         if (emailAlreadyExists) {
//             throw new Error("email has been taken")
//         }
//         const HashPassword = await hashPassword(password);
//         const user = await UserSchema.create({
//             username,
//             fullname: '',
//             imgUrl: '',
//             password: HashPassword,
//             email,
//             role: 'reviewer'
//         });

//         // const verificationToken = await generateVerificationToken(user);
//         // await sendVerifyEmail(user.email, verificationToken);

//         return user;
//     } catch (error: any) {
//        throw new Error( `Server error: ${error.message}`};
//     }
// }

export const getAUser = async (
    id: string
): Promise<any> => {
    try {
        const user = await userModel.findOne({ _id: id }).populate("locations");
        if (!user) {
            throw new Error("user not found")
        }
        return user
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}

export const getUsers = async (
    userId: any
): Promise<any> => {
    try {
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error("user not found")
        }

        let users;
        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, retrieve all users except super admins
            users = await userModel.find({ role: { $ne: RoleType.superAdmin } }).sort({ createdAt: -1 });
        } else {
            // If the user is not a super admin, filter users based on role and allowed locations
            users = await userModel.find({
                role: { $in: [RoleType.reviewer, RoleType.sampler, RoleType.tagger] }, locations: user?.locations?.valueOf()
            }).sort({ createdAt: -1 });
        }

        // Count total users (including all roles for accurate count)
        const totalUsers = 9

        return { users, totalUsers };

    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}

export const userUpdate = async (
    userId: string,
    userData: any
): Promise<any> => {
    try {
        if (userData.password) {
            userData.password = await hashPassword(userData.password)
        }
        if (userData?.location?.valueOf()) {
            const locations = await locationsModels.findById(userData?.location?.valueOf())
            if (!locations) {
                throw new Error("Location doesn't exist!")
            }
        }

        let user = await userModel.findById(userId)

        if (userData.username && user?.username !== userData.username) {
            let userWithUserName = await userModel.findOne({ username: userData.username })
            if (userWithUserName) {
                throw new Error(`User with username ${userData.username} exist!`)
            }
        } else {
            delete userData.username
        }

        if (userData.email && user?.email !== userData.email) {
            let userWithEmail = await userModel.findOne({ email: userData.email })
            if (userWithEmail) {
                throw new Error(`User with email ${userData.email} exist!`)
            }
        } else {
            delete userData.email
        }

        const users = await userModel.findByIdAndUpdate(
            { _id: userId },
            userData,
            { new: true } // Return the updated document
        )

        return users
    } catch (err: any) {
        console.log(err)
        if (err instanceof mongoose.Error.ValidationError) {
            throw new Error('Validation error');
        } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
            throw new Error('Document not found');
        } else if (err instanceof Error && (err as any).code === 11000) {
            const keyPattern = (err as any).keyPattern;
            if (keyPattern.username) {
                throw new Error('Username already exists');
            } else if (keyPattern.email) {
                throw new Error('Email already exists');
            } else {
                throw new Error('Duplicate key error');
            }
        } else {
            throw new Error(`Server error: ${err.message}`);
        }
    }
}
export const getTotalUsers = async (): Promise<any> => {
    try {
        const totalUsers = await userModel.countDocuments();
        return totalUsers
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}
export const getDeletedUsers = async (): Promise<any> => {
    try {
        const totalUsers = await userModel.countDocuments();
        return totalUsers
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}
export const deleteUsers = async (id: string): Promise<any> => {
    try {
        await userModel.findByIdAndDelete({ _id: id })
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}
/**@function sends two factor verificaion email
 
 * @param email:string
 */
export const setTwoFAVerification = async (email: string): Promise<any> => {
    try {
        // Find the user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            throw new Error("user not found")
        }

        const twoFASecret = await generateTwoFactorSecret();
        user.twoFactorAuth.secret = twoFASecret;
        user.save();
        return twoFASecret;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}
export const sendResetVerification = async (email: string): Promise<any> => {
    try {

        // Find the user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            throw new Error("user not found")
        }


        const verificationToken = await generateResetPasswordToken(user._id as unknown as string);

        await sendResetPasswordEmail(user.email, verificationToken);

    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}
/**
 * @DESC verifiy two factor verificaion email and token
 * @param  User email:string 
 * @param token:string 
 */
export const verify2FAToken = async (email: string, token: string): Promise<any> => {
    try {

        const user = await userModel.findOne({ email }).select('+twoFactorAuth.secret');

        if (!user) {
            throw new Error("user not found")
        }

        if (user.twoFactorAuth.secret) {

            const verified = await verifyTwoFactorToken(user.twoFactorAuth.secret, token);
            // Check if verification token matches the one stored in the user document
            if (!verified) {
                throw new Error("invalid verification token")
            }

            if (!user.twoFactorAuth.enabled && verified) {
                user.twoFactorAuth.enabled = true;
                await user.save();
                const new_without_secret = await userModel.findOne({ email })
                const token = await generateJwtToken(user);
                return { status: "success", data: { user: new_without_secret, accessToken: token }, message: "2FA enabled successfully" }
            }

            if (user.twoFactorAuth.enabled && verified) {
                const new_without_secret = await userModel.findOne({ email })
                const token = await generateJwtToken(user);
                return { status: "success", data: { user: new_without_secret, accessToken: token }, message: "2FA verification successful" }
            }
        }

    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}
export const verifyResetToken = async (newPassword: string, token: string): Promise<any> => {
    try {
        const user = await resetPassword(token, newPassword);
        return user;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}
export const recentTaggers = async (): Promise<any> => {
    try {
        const recentTaggers = await userModel.find({ role: 'tagger' }).sort({ createdAt: -1 }).limit(5);
        return recentTaggers;

    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}
export const totalTaggers = async (userId: string): Promise<any> => {
    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error("user not found")
        }

        let totalTaggers;

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, count all taggers without location restriction
            totalTaggers = await userModel.countDocuments({ role: 'tagger' });
        } else {
            // If the user is not a super admin, count taggers based on allowed locations
            totalTaggers = await userModel.countDocuments({ role: 'tagger', locations: user?.locations?.valueOf() });
        }

        return totalTaggers;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}
export const totalReviewers = async (userId: string): Promise<any> => {
    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error("user not found")
        }

        let totalReviewers;

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, count all reviewers without location restriction
            totalReviewers = await userModel.countDocuments({ role: 'reviewer' });
        } else {
            // If the user is not a super admin, count reviewers based on allowed locations
            totalReviewers = await userModel.countDocuments({ role: 'reviewer', locations: user?.locations?.valueOf() });
        }

        return totalReviewers;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}
export const recentReviewers = async (): Promise<any> => {
    try {
        const recentReviewers = await userModel.find({ role: 'reviewer' }).sort({ createdAt: -1 }).limit(5);
        return recentReviewers;

    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}

// export function updateUsers(id: string, arg1: { username: any; email: any; role: any; fullname: any; }) {
//     throw new Error('Function not implemented.');
// }



export async function updatePasswordRelativity(userId: any, newPassword: string): Promise<any> {
    const user = await userModel.findById(userId);
    if (!user) {
        throw new Error("user not found")
    }
    const password = await hashPassword(newPassword);
    const resetUser = await userModel.findByIdAndUpdate(userId,
        { password: password }
    );
    return resetUser;
}

export async function verifyEmailRelativity(userId: any): Promise<any> {
    const user = await userModel.findById(userId);
    if (!user) {
        throw new Error("user not found")
    }
    const isEmailVerified = true;
    await userModel.findByIdAndUpdate(userId,
        { isVerified: isEmailVerified }
    );
}

export async function findAll(): Promise<User[]> {
    return userModel.find();
}

export async function comparePasswords(
    plainPassword: string,
    hashedPassword: string,
): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
}

export async function findOneByUsername(username: string): Promise<User | null | undefined> {
    return userModel.findOne({ username: username });
}

export async function findOneByEmail(email: string): Promise<User | null | undefined> {
    return userModel.findOne({ email: email });
}

export async function findOneById(id: string): Promise<User | null | undefined> {
    return userModel.findById(id);
}

export async function create(createUserDto: any): Promise<any> {
    const { password, ...rest } = createUserDto;
    const hashedPassword = await hashPassword(password);
    const newUser = userModel.create({
        ...rest,
        password: hashedPassword,
    });
    return newUser;
}

export async function update(id: string, updatedUserDto: any): Promise<any> {
    if (updatedUserDto.password) {
        delete updatedUserDto.password; // Don't update the password
    }
    const existingUser = await userModel.findByIdAndUpdate(id, updatedUserDto);
    if (!existingUser) {
        throw new Error(`User with ID ${id} not found`);
    }
    return existingUser;
}

export async function deleteById(id: string): Promise<void> {
    await userModel.findByIdAndDelete({ _id: id });
}

export async function validateUser(
    username: string,
    password: string,
): Promise<boolean | User> {
    try {
        const user = await userModel.findOne({ username: username }).select('+password');
        if (
            user && user.password && (await comparePasswords(password, user.password))
        ) {
            const user_without_password = await userModel.findOne({ username: username })
            return user_without_password ? user_without_password : false;
        } else {
            return false;
        }
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function validateUserById(id: string): Promise<any> {
    return findOneById(id);
}

export async function validateUserByUsername(username: string): Promise<any> {
    return findOneByUsername(username);
}

export async function generateTwoFactorSecret(): Promise<string | undefined> {
    const secret = speakeasy.generateSecret({ length: 20 });
    return secret.base32;
}

export async function login({
    username,
    password,
}: {
    username: string;
    password: string;
}): Promise<{ user: any; accessToken: string } | any> {
    const user = await validateUser(username, password);
    if (user) {
        const token = await generateJwtToken(user);
        const user_without_password = await findOneByUsername(username);
        return { user: user_without_password, accessToken: token };
    } else {
        throw new Error('Invalid credentials');
    }
}

export async function register(createUserDto: any): Promise<any> {
    const existingUser = await findOneByUsername(
        createUserDto.username,
    );
    if (existingUser) {
        throw new Error('Username is already taken');
    }
    const user = await create(createUserDto);
    return user;
}

export async function verifyEmail(token: string): Promise<any> {
    try {
        const secretKey = process.env.EMAIL_VERIFICATION_SECRET || 'default-verify-email-secret';;
        const decodedToken: any = jwt.verify(
            token,
            secretKey
        );
        const userId = decodedToken.userId;
        await verifyEmailRelativity(userId);
    } catch (error) {
        throw new Error('Invalid or expired verification token');
    }
}


export async function requestPasswordReset(email: string): Promise<any> {
    try {
        const user = await findOneByEmail(email);
        if (!user) {
            throw new Error("User not found");
        }
        const resetToken = await generateResetPasswordToken(user?._id as unknown as string);
        sendResetPasswordEmail(user.email, resetToken);
    }
    catch (error: any) {
        throw new Error(error?.message);
    }
}

export async function resetPassword(token: string, password: string): Promise<any> {
    try {
        const secretKey =
            process.env.RESET_PASSWORD_SECRET || 'default-reset-password-secret';
        const decodedToken: any = jwt.verify(
            token,
            secretKey
        );

        if (decodedToken.exp && Date.now() >= decodedToken.exp * 1000) {
            throw new Error('Reset password token has expired');
        }

        const userId = decodedToken.sub;
        await updatePasswordRelativity(userId, password);
    } catch (error) {
        console.log(error)
        throw new Error('Invalid or expired reset password token');
    }
}

export async function generateJwtToken(user: any): Promise<string> {
    const payload = { username: user.username, userId: user._id, role: user.role };
    const secretKey = process.env.JWT_SECRET_KEY || 'default-secret-key';
    const expiresIn = process.env.JWT_ACCESS_LIFETIME || '30d';
    return jwt.sign(payload, secretKey, { expiresIn });
}

export async function generateVerificationToken(user: any): Promise<string> {
    const payload = { username: user.username, userId: user._id, role: user.role };
    const secretKey = process.env.JWT_SECRET_KEY || 'default-secret-key';
    const expiresIn = process.env.JWT_ACCESS_LIFETIME || '30d';
    return jwt.sign(payload, secretKey, { expiresIn });
}

export async function generateResetPasswordToken(userId: string): Promise<string> {
    const secretKey =
        process.env.RESET_PASSWORD_SECRET || 'default-reset-password-secret';
    const expiresIn = '1h';
    return jwt.sign({ sub: userId }, secretKey, { expiresIn });
}

export async function updateProfile(id: string, updateUserDto: any): Promise<any> {
    const existingUser = await findOneById(id);
    if (!existingUser) {
        throw new Error(`User with ID ${id} not found`);
    }
    Object.assign(existingUser, updateUserDto);
    return update(id, existingUser);
}

export async function verifyTwoFactorToken(secret: string, token: string): Promise<boolean> {
    const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
    });
    return verified;
}


export async function seedSuperAdmin() {
    try {
        const superAdminData = {
            username: 'superadmin',
            fullname: 'Super Admin',
            password: 'superadmin',
            email: 'superadmin',
            role: RoleType.superAdmin,
            isVerified: true,
        };
        const existingSuperAdmin = await userModel.findOne({ role: RoleType.superAdmin });
        if (existingSuperAdmin) {
            console.log("super admin already exists, password, username and email are superadmin")
            return
        }
        superAdminData.password = await hashPassword(superAdminData.password);
        const newSuperAdmin = new userModel(superAdminData);
        await newSuperAdmin.save();
        console.log("super admin created, password, username and email is superadmin")
    } catch (error) {
        console.error('Error seeding SuperAdmin:', error);
    }
}
