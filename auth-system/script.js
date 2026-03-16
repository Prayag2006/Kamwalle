import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";

// --- STEP 0: FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDMmhdftY0AN0bHByPOu26XUsq-4I9rdOc",
  authDomain: "kamwalle.firebaseapp.com",
  projectId: "kamwalle",
  storageBucket: "kamwalle.firebasestorage.app",
  messagingSenderId: "449171891568",
  appId: "1:449171891568:web:a9cadff8d6c418ed8c5bb5",
  measurementId: "G-CR8G0W4FPS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// --- DOM ELEMENTS ---
const loginCard = document.getElementById('loginCard');
const waitingCard = document.getElementById('waitingCard');
const successCard = document.getElementById('successCard');
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const sendLinkBtn = document.getElementById('sendLinkBtn');
const displayEmail = document.getElementById('displayEmail');
const finalUserEmail = document.getElementById('finalUserEmail');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    handleIncomingLink();
});

// --- CORE FUNCTIONS ---

/**
 * Sends a Magic Login Link to the user's email
 */
async function handleSendLink(e) {
    if (e) e.preventDefault();
    
    const email = emailInput.value.trim();
    if (!validateEmail(email)) {
        showToast('error', 'Invalid Email', 'Please enter a valid email address.');
        return;
    }

    setLoading(sendLinkBtn, true);

    const actionCodeSettings = {
        // URL you want to redirect back to. The domain (www.example.com) for this
        // URL must be whitelisted in the Firebase Console.
        url: window.location.href,
        // This must be true.
        handleCodeInApp: true,
    };

    try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        
        // Save the email locally so you don't have to ask the user for it again
        // if they open the link on the same device.
        window.localStorage.setItem('emailForSignIn', email);

        // UI Transition
        displayEmail.textContent = email;
        showToast('success', 'Link Sent!', 'Check your inbox for the magic login link.');
        switchCard('waitingCard');

    } catch (error) {
        console.error('Firebase Auth Error:', error);
        showToast('error', 'Sending Failed', error.message);
    } finally {
        setLoading(sendLinkBtn, false);
    }
}

/**
 * Handles the incoming sign-in link
 */
async function handleIncomingLink() {
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        
        if (!email) {
            // User opened the link on a different device. To prevent session-fixation
            // attacks, ask the user to provide the associated email.
            email = window.prompt('Please provide your email for confirmation');
        }

        showToast('warning', 'Authenticating', 'Completing your sign-in...');
        
        try {
            const result = await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            
            // Success
            finalUserEmail.textContent = result.user.email;
            showToast('success', 'Login Successful', 'Welcome back!');
            switchCard('successCard');
            
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
        } catch (error) {
            console.error('Sign-in Error:', error);
            showToast('error', 'Authentication Failed', 'The link may have expired or already been used.');
            switchCard('loginCard');
        }
    }
}

// --- UI UTILITIES ---

function switchCard(cardId) {
    const cards = [loginCard, waitingCard, successCard];
    cards.forEach(card => {
        card.classList.add('hidden');
        card.style.display = 'none';
    });
    
    const activeCard = document.getElementById(cardId);
    activeCard.style.display = 'block';
    setTimeout(() => activeCard.classList.remove('hidden'), 50);
}

function setLoading(button, isLoading) {
    const span = button.querySelector('span');
    const icon = button.querySelector('i');
    
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = span.textContent;
        span.textContent = 'Sending...';
        icon.className = 'ph ph-spinner spinner';
    } else {
        button.disabled = false;
        span.textContent = button.dataset.originalText || span.textContent;
        icon.className = 'ph ph-paper-plane-tilt';
    }
}

function validateEmail(email) {
    return String(email)
        .toLowerCase()
        .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
}

function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'ph-check-circle',
        error: 'ph-x-circle',
        warning: 'ph-warning-circle'
    };

    toast.innerHTML = `
        <i class="ph-fill ${iconMap[type]}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- EVENT LISTENERS ---
loginForm.addEventListener('submit', handleSendLink);
