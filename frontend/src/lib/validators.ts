/**
 * Validation utility functions
 */

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (min 8 chars, at least one letter and one number)
export const isValidPassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
};

// Username validation (alphanumeric and underscore, 3-20 chars)
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// URL validation
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ISBN validation
export const isValidISBN = (isbn) => {
  // Remove hyphens and spaces
  const cleaned = isbn.replace(/[-\s]/g, '');
  
  // Check if it's ISBN-10 or ISBN-13
  if (cleaned.length === 10) {
    return isValidISBN10(cleaned);
  } else if (cleaned.length === 13) {
    return isValidISBN13(cleaned);
  }
  
  return false;
};

// ISBN-10 validation
const isValidISBN10 = (isbn) => {
  if (!/^\d{9}[\dX]$/.test(isbn)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn[i]) * (10 - i);
  }
  
  const checkDigit = isbn[9] === 'X' ? 10 : parseInt(isbn[9]);
  sum += checkDigit;
  
  return sum % 11 === 0;
};

// ISBN-13 validation
const isValidISBN13 = (isbn) => {
  if (!/^\d{13}$/.test(isbn)) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return checkDigit === parseInt(isbn[12]);
};

// Phone number validation (basic)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-+()]{10,}$/;
  return phoneRegex.test(phone);
};

// Required field validation
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

// Min length validation
export const minLength = (value, min) => {
  if (!value) return false;
  return value.length >= min;
};

// Max length validation
export const maxLength = (value, max) => {
  if (!value) return true; // Empty is valid for max length
  return value.length <= max;
};

// Number range validation
export const isInRange = (value, min, max) => {
  const num = Number(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
};

// File size validation
export const isValidFileSize = (file, maxSizeInBytes) => {
  return file.size <= maxSizeInBytes;
};

// File type validation
export const isValidFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

// Image file validation
export const isValidImage = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return isValidFileType(file, allowedTypes);
};

// Date validation (must be in the past)
export const isPastDate = (date) => {
  const d = new Date(date);
  return d < new Date();
};

// Date validation (must be in the future)
export const isFutureDate = (date) => {
  const d = new Date(date);
  return d > new Date();
};

// Validate reading progress (0-100%)
export const isValidProgress = (value) => {
  const num = Number(value);
  return !isNaN(num) && num >= 0 && num <= 100;
};

// Validate page number
export const isValidPageNumber = (current, total) => {
  const currentNum = Number(current);
  const totalNum = Number(total);
  
  if (isNaN(currentNum) || isNaN(totalNum)) return false;
  if (currentNum < 0) return false;
  if (totalNum > 0 && currentNum > totalNum) return false;
  
  return true;
};

// Rating validation (1-5 stars)
export const isValidRating = (rating) => {
  const num = Number(rating);
  return !isNaN(num) && num >= 1 && num <= 5;
};

// Form validation helper
export const validateForm = (values, rules) => {
  const errors = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = values[field];
    
    for (const rule of fieldRules) {
      const { type, message, ...params } = rule;
      
      let isValid = true;
      
      switch (type) {
        case 'required':
          isValid = isRequired(value);
          break;
        case 'email':
          isValid = !value || isValidEmail(value);
          break;
        case 'password':
          isValid = !value || isValidPassword(value);
          break;
        case 'minLength':
          isValid = !value || minLength(value, params.min);
          break;
        case 'maxLength':
          isValid = !value || maxLength(value, params.max);
          break;
        case 'custom':
          isValid = params.validator(value, values);
          break;
        default:
          break;
      }
      
      if (!isValid) {
        errors[field] = message;
        break; // Stop at first error for this field
      }
    }
  }
  
  return errors;
};
