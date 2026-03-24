const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Create Nodemailer Transporter using Gmail and App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'infokamwalle@gmail.com',
        pass: 'wghfladqkdjmrlub' // Spliced app password for Nodemailer (removed spaces)
    }
});

exports.sendCustomResetEmail = functions.https.onCall(async (data, context) => {
    const email = data.email;

    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with one argument "email".');
    }

    try {
        // Generate the reset link using Firebase Auth
        // The actionCodeSettings ensures it returns back to the default handler or custom one if specified.
        const resetLink = await admin.auth().generatePasswordResetLink(email);

        // Beautiful Premium HTML Email Design
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

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent to:', email);
        return { success: true, message: `Email successfully sent to ${email}` };

    } catch (error) {
        console.error('Error sending custom reset email:', error);
        throw new functions.https.HttpsError('internal', 'Unable to send password reset email. ' + error.message);
    }
});

