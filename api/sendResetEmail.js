const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        // Initialize Firebase Admin
        if (!admin.apps.length) {
            if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
                console.error("FIREBASE_SERVICE_ACCOUNT environment variable is missing.");
                // For local execution fallback, we check if it is provided. Note: local dev requires this env var.
                return res.status(500).json({ error: 'Server configuration error: Missing Firebase Credentials.' });
            }
            try {
                let envString = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
                if ((envString.startsWith("'") && envString.endsWith("'")) || (envString.startsWith('"') && envString.endsWith('"'))) {
                    envString = envString.slice(1, -1);
                }
                const serviceAccount = JSON.parse(envString);
                // Fix for dotenv escaping newlines in private key
                if (serviceAccount.private_key) {
                    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
                }
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            } catch(e) {
                console.error("Error parsing FIREBASE_SERVICE_ACCOUNT JSON", e);
                return res.status(500).json({ error: 'Server configuration error: Invalid Firebase Credentials.' });
            }
        }

        // Dynamic domain mapping so it uses the Vercel custom domain
        const origin = req.headers.origin || `https://${req.headers.host}`;
        
        // Generate reset link using Firebase Auth Admin SDK
        const actionCodeSettings = {
            url: `${origin}/login.html`,
            handleCodeInApp: false
        };
        const firebaseLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);
        
        // The firebaseLink is the default Firebase app URL (kamwala-app-xyz123.firebaseapp.com)
        // We extract the oobCode (token) and apiKey from it to create our custom domain link
        const urlObj = new URL(firebaseLink);
        const resetLink = `${origin}/reset-password.html${urlObj.search}`;

        // Send Custom Premium HTML Email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'infokamwalle@gmail.com',
                pass: 'wghfladqkdjmrlub' 
            }
        });

        const mailOptions = {
            from: '"Kamwalle Support" <infokamwalle@gmail.com>',
            to: email,
            subject: 'Reset Your Kamwalle Password',
            html: `
            <div style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f7f6; padding: 20px;">
                <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 32px; letter-spacing: 2px; text-transform: uppercase;">KAMWALLE</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Password Reset Request</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            Hello! <br><br>
                            We received a request to reset the password for your Kamwalle account associated with this email address. 
                            If you made this request, please click the button below to set a new password securely.
                        </p>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${resetLink}" style="background-color: #10b981; color: white; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25); transition: background-color 0.3s;">Reset My Password</a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 30px;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="${resetLink}" style="color: #10b981; text-decoration: none; word-break: break-all; margin-top: 8px; display: inline-block;">${resetLink}</a>
                        </p>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0; line-height: 1.5;">
                            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.<br><br>
                            &copy; ${new Date().getFullYear()} Kamwalle Team
                        </p>
                    </div>
                </div>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Password reset email sent successfully.' });

    } catch (error) {
        console.error('Error sending custom reset email:', error);
        return res.status(500).json({ error: 'Unable to send password reset email. ' + (error.message || '') });
    }
}
