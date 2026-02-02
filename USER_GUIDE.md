# ThankYouGram Test Guide

Welcome to **ThankYouGram**! This guide outlines the steps to register, log in, and track "ThankYouGrams"—acts of kindness or positive impact.

## 1. Registration

You can register as an **Individual** or an **Organization**.

### A. Individual Registration
1.  Navigate to the registration page (e.g., `/register`).
2.  Select **Individual**.
3.  **Fill in the details**:
    -   **Slug (ID)**: A unique identifier for your profile URL (e.g., `john-doe`).
    -   **Full Name**: Your display name.
    -   **Email**: Your login email.
    -   **Password**: Create a secure password.
    -   **City & Country**: Your location.
    -   **Organization (Optional)**: If you belong to a registered organization, select it from the dropdown. This links your ThankYouGrams to their count (Tier 2 tracking).
    -   **Consent**: Check "Consent to join organization later" if you want to allow organizations to add you later.
4.  Click **Register**.
5.  On success, you will be redirected to the Login page.

### B. Organization Registration
1.  Navigate to `/register` and select **Organization**.
2.  **Fill in the details**:
    -   **Organization ID (Slug)**: Unique ID for the org profile (e.g., `acme-corp`).
    -   **Organization Name**: Display name.
    -   **Login Email**: Email for managing the account.
    -   **Password**: Create a password.
    -   **Location**: City & Country.
    -   **Contact**: Person and Email (optional).
3.  Click **Register Organization**.

## 2. Logging In
1.  Navigate to `/login`.
2.  Enter your **Email** and **Password**.
3.  Click **Sign in**.
4.  If it's your first time or you have a temporary password, you may be asked to change it.
5.  Otherwise, you will be directed to your **Profile Page** (`/[slug]`).

## 3. Logging a ThankYouGram
Once logged in, you can register a new ThankYouGram.

1.  Click **"Register ThankYouGram"** (usually in the navigation or on your profile).
2.  **Location**: The app will automatically try to detect your location.
    -   *Note: Allow location access if prompted.*
3.  **Optional Details**:
    -   **URL**: Link to a related post or proof.
    -   **Comment**: A brief thought or description.
4.  **Confirmation**: Check the box **"I did a ThankYouGram!"**.
5.  Click **Register ThankYouGram**.

### What Happens Next?
-   **Success Screen**: You'll see a confirmation.
-   **Tier 1 (Individual)**: Your personal ThankYouGram count increases by 1.
-   **Tier 2 (Organization)**: If you are linked to an organization, their count also increases by 1 automatically.
-   You can click **"Register Another"** or **"Go to Profile"** to see your updated stats.
