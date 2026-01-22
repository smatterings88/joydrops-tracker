/**
 * List of admin email addresses
 * Add admin emails here to grant access to admin pages
 */
const ADMIN_EMAILS = [
    'mgzobel@icloud.com',
    // Add more admin emails here as needed
];

/**
 * Check if a user is an admin based on their email
 */
export function isAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
}
