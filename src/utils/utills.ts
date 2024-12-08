/**@function generates 6 randon digits for reset password
 * @default '''
 * @returns randomNumbers
 */
export const generateSixDigitRandomNumber = (): string => {
    let randomNumber = '';
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
    let randomNumber = '';
    for (let i = 0; i < 4; i++) {
        // Generate a random digit from 0 to 9 and append it to the randomNumber string
        randomNumber += Math.floor(Math.random() * 10).toString();
    }
    return randomNumber;
};