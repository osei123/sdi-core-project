export const validatePassword = (password) => {
    const rules = {
        minLength: password.length >= 8,
        hasUpper: /[A-Z]/.test(password),
        hasLower: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const passedCount = Object.values(rules).filter(Boolean).length;

    let strength = 'Weak';
    if (passedCount >= 5) strength = 'Strong';
    else if (passedCount >= 3) strength = 'Medium';

    return {
        isValid: passedCount >= 5, // Require all rules for "valid"
        score: passedCount,
        strength,
        rules
    };
};
