// import { UserController } from '../resources/users/users.controller';
// import { Request, Response } from 'express';
// import { signUpAdmin } from '../resources/users/user.services';
// import UserSchema from '../resources/users/user.model';
// import userModel from '../resources/users/user.model';
// import User, { RoleType } from '@/resources/users/user.Interface';
// import mongoose from 'mongoose';

// jest.mock('../models/userModel');

// describe('SignUpAdmin Service', () => {
//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     it('should sign up admin with valid credentials', async () => {
//         const email = 'test@example.com';
//         const password = 'password123';
//         const username = 'testuser';
//         const photoFile = Buffer.from('fakePhoto');

//         const s3Mock = {
//             upload: jest.fn().mockReturnThis(),
//             promise: jest.fn().mockResolvedValueOnce({ key: 'uploadedKey' }),
//         };

//         enum RoleType {
//             tagger = 'tagger',
//             // Add other roles if needed
//         }

//         // Define the interface for User
//         interface User {
//             username: string;
//             fullname?: string;
//             password: string;
//             imageUrl?: string;
//             email: string;
//             role: RoleType;
//             isVerified?: boolean;
//             models?: mongoose.Types.ObjectId[];
//             twoFactorAuth: {
//                 enabled: boolean;
//                 secret?: string;
//             };
//         }

//         // Generate a mock ObjectId for models if needed
//         const mockModelId = new mongoose.Types.ObjectId();

//         // Complete the mock data
//         const userMock: User = {
//             username: 'testUser',
//             password: 'password123',
//             email: 'test@example.com',
//             role: RoleType.tagger, // Assuming default role is 'tagger'
//             twoFactorAuth: {
//                 enabled: false,
//             },
//         };

//         // Optional fields can be added conditionally if needed
//         if (userMock.fullname === undefined) {
//             userMock.fullname = 'Test User';
//         }

//         // Example of adding a model reference
//         if (userMock.models === undefined) {
//             userMock.models = [mockModelId]; // Assuming model reference is required
//         }

//         // Example of adding imageUrl if available
//         if (userMock.imageUrl === undefined) {
//             userMock.imageUrl = 'defaultImageUrl';
//         }

//         // Example of adding isVerified if available
//         if (userMock.isVerified === undefined) {
//             userMock.isVerified = false; // Assuming user is not verified by default
//         }

//         // Example of adding twoFactorAuth secret if two-factor authentication is enabled
//         if (userMock.twoFactorAuth.enabled && userMock.twoFactorAuth.secret === undefined) {
//             // Generate a random secret or provide a default value
//             userMock.twoFactorAuth.secret = 'randomSecret';
//         }
//         const createMock = jest.spyOn(userModel, 'create').mockResolvedValue(userMock);
//         const userServiceMock = {
//             signUpAdmin: jest.fn().mockImplementation(() => {
//                 return {
//                     photoUrl: 'uploadedPhotoUrl',
//                     username,
//                     email,
//                     password: 'hashedPassword',
//                     role: 'superAdmin',
//                     // Other user properties...
//                 };
//             }),
//         };

//         const result = await signUpAdmin(email, password, username, photoFile);

//         expect(s3Mock.upload).toHaveBeenCalled();
//         expect(createMock).toHaveBeenCalledWith({
//             username,
//             fullname: '',
//             fullname: '',
//             imageUrl: 'uploadedPhotoUrl',
//             password: 'hashedPassword',
//             email,
//             role: 'superAdmin',
//         });

//         expect(result).toEqual({
//             user: {
//                 username,
//                 photoUrl: 'uploadedPhotoUrl',
//                 email,
//                 password: 'hashedPassword',
//                 role: 'superAdmin',
//                 // Other user properties...
//             },
//         });
//     });

//     it('should throw error for existing email', async () => {
//         const email = 'existing@example.com';
//         const password = 'password123';
//         const username = 'testuser';
//         const photoFile = Buffer.from('fakePhoto');

//         jest.spyOn(UserSchema, 'findOne').mockResolvedValueOnce({ email });

//         await expect(signUpAdmin(email, password, username, photoFile)).rejects.toThrow('email has been taken');
//     });
// });
