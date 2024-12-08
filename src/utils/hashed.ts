import bcrypt from 'bcryptjs'
export async function hashPassword(password: any) {
    try {
        const salt = await bcrypt.genSalt(10); // Generate a salt with a complexity of 10
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password using the generated salt
        return hashedPassword; // Return the hashed password
    } catch (error) {
        // Handle error
        throw new Error('Error hashing password for user');
    }
}

