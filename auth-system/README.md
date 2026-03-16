# Secure OTP Email Authentication System 🔐

A modern, responsive, and secure OTP-based email authentication system built with **Firebase** and **EmailJS**.

## Features
- 📧 **Email-based OTP**: Real email delivery via EmailJS.
- 🔥 **Firebase Integrated**: Ready to be linked with Firebase Authentication.
- ⚡ **Modern UI**: Clean design with "Plus Jakarta Sans" typography and Phosphor Icons.
- ⏳ **OTP Expiration**: Built-in 5-minute expiration logic.
- ⏲️ **Resend Timer**: 60-second cooldown to prevent spam.
- 📱 **Fully Responsive**: Works perfectly on mobile, tablet, and desktop.
- 🔔 **Toast Notifications**: Professional success/error messaging.

## Setup Instructions

### 1. Firebase Configuration
- Go to the [Firebase Console](https://console.firebase.google.com/).
- Create a new project.
- Register a "Web App" and copy the `firebaseConfig` object.
- Open `script.js` and paste the config into the `firebaseConfig` constant (Line 8).

### 2. EmailJS Setup (For real emails)
- Create a free account at [emailjs.com](https://www.emailjs.com/).
- Add a **Email Service** (e.g., Gmail).
- Create an **Email Template** with the following variables:
  - `{{otp_code}}`: The 6-digit code.
  - `{{to_email}}`: The recipient's email.
- In `script.js`:
  - Replace `YOUR_PUBLIC_KEY` with your Public Key (found in Account settings).
  - Replace `YOUR_SERVICE_ID` with your Service ID.
  - Replace `YOUR_TEMPLATE_ID` with your Template ID.

### 3. Deployment
This project is ready for one-click deployment on:
- **Vercel**: Just connect your GitHub repo.
- **Netlify**: Drag and drop the `auth-system` folder.
- **Firebase Hosting**: Run `firebase deploy`.

## Project Structure
```text
auth-system/
├── index.html   # Main structure & multi-step cards
├── style.css    # Modern styling & animations
└── script.js    # Firebase & OTP logic
```

## Security Note
For a production environment, it is highly recommended to generate and verify OTPs on a **Server-side (Cloud Functions)** to prevent client-side tampering. This demo provides a robust frontend implementation that can be easily extended.

---
Created with ❤️ by Antigravity
