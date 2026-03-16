import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    sendSignInLinkToEmail, 
    isSignInWithEmailLink, 
    signInWithEmailLink,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore,
    doc,
    setDoc, 
    getDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

/**
 * KAMWALLE Premium Theme Scripts
 */

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCtJR1H_LDRD57whrjRt-5TCWolO-CQISM",
  authDomain: "kamwala-app-xyz123.firebaseapp.com",
  projectId: "kamwala-app-xyz123",
  storageBucket: "kamwala-app-xyz123.firebasestorage.app",
  messagingSenderId: "529469429266",
  appId: "1:529469429266:web:99cc209cc4e7bb0c5c2acb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Analytics initialization failed, likely due to environment restrictions:", e);
}

console.log("Firebase App initialized for project:", firebaseConfig.projectId);

// --- GLOBAL FUNCTIONS (Assigned early for HTML access) ---
window.handleLogout = async function() {
    console.log("Logout triggered");
    if (confirm("Are you sure you want to logout?")) {
        try {
            await signOut(auth);
            alert("Logged out successfully!");
            if (window.closeAuthModal) window.closeAuthModal();
        } catch (error) {
            console.error("Logout error:", error);
            alert("Logout failed");
        }
    }
};

window.handleGoogleLogin = async function() {
    console.log("Starting Google Login...");
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await saveUserToFirestore(result.user);
        alert("Signed in with Google successfully!");
        if (window.closeAuthModal) window.closeAuthModal();
    } catch (error) {
        console.error("Google Login Error:", error);
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
            try {
                await signInWithRedirect(auth, provider);
            } catch (redirError) {
                console.error("Redirect fallback error:", redirError);
            }
        } else {
            alert("Google Sign-In Error: " + error.message);
        }
    }
};

window.openAuthModal = function(mode = 'login') {
    const modal = document.getElementById('authModalOverlay');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (window.switchAuthMode) window.switchAuthMode(mode);
    }
};

window.closeAuthModal = function() {
    const modal = document.getElementById('authModalOverlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

window.switchAuthMode = function(mode) {
    const loginCont = document.getElementById('loginFormContainer');
    const registerCont = document.getElementById('registerFormContainer');
    const profileCont = document.getElementById('profileContainer');

    if (loginCont) loginCont.classList.add('hidden');
    if (registerCont) registerCont.classList.add('hidden');
    if (profileCont) profileCont.classList.add('hidden');

    if (mode === 'login' && loginCont) loginCont.classList.remove('hidden');
    else if (mode === 'register' && registerCont) registerCont.classList.remove('hidden');
    else if (mode === 'profile' && profileCont) profileCont.classList.remove('hidden');
};

window.showProfile = function() {
    window.location.href = 'profile.html';
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Dynamic current year in footer
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // 2. Sticky Header with blur effect
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 3. Mobile Navigation Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navbar = document.getElementById('navbar');
    const menuOverlay = document.getElementById('menu-overlay');
    
    function toggleMenu() {
        navbar.classList.toggle('active');
        if (menuOverlay) menuOverlay.classList.toggle('active');
        
        // Toggle icon
        const icon = mobileToggle.querySelector('i');
        if (navbar.classList.contains('active')) {
            icon.classList.replace('ph-list', 'ph-x');
            document.body.style.overflow = 'hidden';
        } else {
            icon.classList.replace('ph-x', 'ph-list');
            document.body.style.overflow = '';
        }
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMenu);
    }

    if (menuOverlay) {
        menuOverlay.addEventListener('click', toggleMenu);
    }

    // Close menu when clicking a link
    const navLinks = document.querySelectorAll('.nav-links, .nav-link, .dropdown-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbar.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    // 4. Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                // Offset for fixed header
                const headerHeight = header.offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
  
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // 5. Booking Form Mock Submission
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = bookingForm.querySelector('button');
            const input = bookingForm.querySelector('input');
            const originalText = btn.textContent;
            
            // Gandhinagar Pincode Validation (Starts with 382)
            const pincode = input.value.trim();
            const isGandhinagarPincode = /^382\d{3}$/.test(pincode);
            
            // Show loading state
            btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Checking...';
            btn.disabled = true;
            
            // Simulate network request
            setTimeout(() => {
                if (isGandhinagarPincode) {
                    btn.innerHTML = '<i class="ph ph-check-circle"></i> Service Available!';
                    btn.style.backgroundColor = '#10b981'; // Success green
                } else {
                    btn.innerHTML = '<i class="ph-fill ph-x-circle"></i> Not Available Here';
                    btn.style.backgroundColor = '#ef4444'; // Error red
                }
                
                // Reset after 3 seconds
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    btn.style.backgroundColor = '';
                    if (isGandhinagarPincode) {
                        input.value = ''; // clear on success
                    }
                }, 3000);
            }, 1000);
        });
    }

    // 6. FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all items
            faqItems.forEach(faq => {
                faq.classList.remove('active');
                faq.querySelector('.faq-answer').style.maxHeight = null;
            });
            
            // Open clicked if not previously active
            if (!isActive) {
                item.classList.add('active');
                const answer = item.querySelector('.faq-answer');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
    // 7. Contact Us Form Handling
    const contactForm = document.getElementById('contactUsForm');
    const contactSuccessMsg = document.getElementById('contactFormSuccess');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Gather details
            const contactData = {
                id: Date.now(),
                name: document.getElementById('c_name').value,
                email: document.getElementById('c_email').value,
                phone: document.getElementById('c_phone').value,
                address: document.getElementById('c_address').value,
                postal: document.getElementById('c_postal').value,
                date: new Date().toLocaleString()
            };
            
            // Save to localStorage (acting as simple database)
            let existingRequests = JSON.parse(localStorage.getItem('KAMWALLE_contacts')) || [];
            existingRequests.unshift(contactData); // Add new to top
            localStorage.setItem('KAMWALLE_contacts', JSON.stringify(existingRequests));
            
            // Show Success Message
            contactSuccessMsg.classList.remove('hidden');
            contactForm.reset();
            
            // Hide message after a few seconds
            setTimeout(() => {
                contactSuccessMsg.classList.add('hidden');
            }, 5000);
        });
    }

    // Check for Magic Link on load
    handleIncomingLink();

    // Check for Google Redirect Result
    getRedirectResult(auth).then((result) => {
        if (result) {
            console.log("Google login successful via redirect!");
            // Success logic is already handled by onAuthStateChanged
            // but we could also save to Firestore here if we want to be explicit
            const user = result.user;
            saveUserToFirestore(user);
        }
    }).catch((error) => {
        console.error("Google Redirect Error:", error);
        if (error.code !== 'auth/redirect-cancelled-by-user') {
            alert("Google Redirect Login Error: " + error.message);
        }
    });

    // 8. Auth State Listener
    onAuthStateChanged(auth, async (user) => {
        const authActionGroups = document.querySelectorAll('.auth-ui-group');
        const userProfileGroups = document.querySelectorAll('.profile-ui-group');
        const userNames = document.querySelectorAll('.header-user-name');
        
        if (user) {
            // User is signed in
            authActionGroups.forEach(el => el.classList.add('hidden'));
            userProfileGroups.forEach(el => el.classList.remove('hidden'));
            
            // Get user data from Firestore
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                
                let displayName = user.displayName?.split(' ')[0] || 'User';

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    displayName = userData.name.split(' ')[0];
                    // Populate profile modal
                    if (document.getElementById('p_name')) document.getElementById('p_name').textContent = userData.name;
                    if (document.getElementById('p_email')) document.getElementById('p_email').textContent = userData.email;
                    if (document.getElementById('p_phone')) document.getElementById('p_phone').textContent = userData.phone;
                    if (document.getElementById('p_greeting')) document.getElementById('p_greeting').textContent = 'Hi, ' + displayName + '!';
                    
                    if (document.getElementById('p_since') && userData.createdAt) {
                        const date = new Date(userData.createdAt);
                        document.getElementById('p_since').textContent = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                    }
                } else {
                    // FALLBACK: If user exists in Auth but not in Firestore, create the record now
                    console.log("User doc missing in Firestore, creating fallback record...");
                    const fallbackData = {
                        name: user.displayName || 'Kamwalle User',
                        email: user.email,
                        phone: user.phoneNumber || 'N/A',
                        uid: user.uid,
                        createdAt: new Date().toISOString()
                    };
                    await setDoc(userDocRef, fallbackData);
                    displayName = fallbackData.name.split(' ')[0];
                    if (document.getElementById('p_greeting')) document.getElementById('p_greeting').textContent = 'Hi, ' + displayName + '!';
                }

                userNames.forEach(el => el.textContent = displayName);
                
                // Load Payment History for all logged-in users
                loadUserHistory(user.uid);
            } catch (error) {
                console.error("Error managing user data:", error);
                userNames.forEach(el => el.textContent = user.displayName?.split(' ')[0] || 'User');
                // Even if doc fetch fails, try to load history
                loadUserHistory(user.uid);
            }
        } else {
            // User is signed out
            authActionGroups.forEach(el => el.classList.remove('hidden'));
            userProfileGroups.forEach(el => el.classList.add('hidden'));
            
            // Redirect if on profile page and logged out
            if (window.location.href.includes('profile.html')) {
                window.location.href = 'index.html';
            }
        }
    });

    // 9. Auth Form Handlers
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

/* =======================================================
   Booking Modal Logic
   ======================================================= */
const servicePrices = {
    cleaning: { name: 'Deep Home Cleaning', price: 499 },
    cooking: { name: 'Cooking Service', price: 599 },
    maid: { name: 'Maid / Domestic Help', price: 399 },
    pest: { name: 'Pest Control', price: 999 },
    monthly: { name: 'Monthly Package', price: 1800 }
};

window.openBookingModal = async function() {
    document.getElementById('bookingModalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    resetBookingModal();

    // Auto-fill if user is logged in
    const user = auth.currentUser;
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (document.getElementById('b_name')) document.getElementById('b_name').value = userData.name;
                if (document.getElementById('b_phone')) document.getElementById('b_phone').value = userData.phone;
                if (document.getElementById('b_email')) document.getElementById('b_email').value = userData.email;
            }
        } catch (error) {
            console.error("Error auto-filling booking form:", error);
        }
    }
}

window.closeBookingModal = function() {
    document.getElementById('bookingModalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// Close on overlay click
document.getElementById('bookingModalOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeBookingModal();
});

function resetBookingModal() {
    showStep(1);
    document.getElementById('otpSection').classList.add('hidden');
    // We only clear if not in the middle of a magic link process
    if (!localStorage.getItem('KAMWALLE_pending_booking')) {
        ['b_name','b_flat','b_street','b_pin','b_phone','b_email'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }
    document.getElementById('b_city').value = 'Gandhinagar';
    document.getElementById('b_service').value = '';
    const sendBtn = document.getElementById('sendOtpBtn');
    if(sendBtn) {
        sendBtn.innerHTML = 'Send Magic Login Link <i class="ph ph-paper-plane-tilt"></i>';
        sendBtn.disabled = false;
    }
}

function showStep(stepNum) {
    // Hide all steps
    document.getElementById('bookStep1').classList.add('hidden');
    document.getElementById('bookStep2').classList.add('hidden');
    document.getElementById('bookStep3').classList.add('hidden');

    // Show active step
    document.getElementById('bookStep' + stepNum).classList.remove('hidden');

    // Scroll modal to top on step change
    const modal = document.querySelector('.booking-modal');
    if (modal) modal.scrollTop = 0;

    // Update indicators
    for (let i = 1; i <= 3; i++) {
        const ind = document.getElementById('stepInd' + i);
        if (ind) {
            ind.classList.remove('active', 'done');
            if (i < stepNum) ind.classList.add('done');
            if (i === stepNum) ind.classList.add('active');
        }
    }
}

/* Step 1 → Step 2 */
window.goToStep2 = function() {
    const name = document.getElementById('b_name').value.trim();
    const flat = document.getElementById('b_flat').value.trim();
    const street = document.getElementById('b_street').value.trim();
    const city = document.getElementById('b_city').value.trim();
    const pin = document.getElementById('b_pin').value.trim();
    const phone = document.getElementById('b_phone').value.trim();
    const service = document.getElementById('b_service').value;

    if (!name || !flat || !street || !city || !pin || !phone || !service) {
        alert('Please fill in all required fields.');
        return;
    }
    if (pin.length !== 6 || isNaN(pin)) {
        alert('Please enter a valid 6-digit pincode.');
        return;
    }
    if (phone.length !== 10 || isNaN(phone)) {
        alert('Please enter a valid 10-digit phone number.');
        return;
    }

    // If user is already logged in, skip Step 2 and go to Step 3
    if (auth.currentUser) {
        const serviceInfo = servicePrices[service];
        document.getElementById('summaryService').textContent = serviceInfo.name;
        document.getElementById('summaryName').textContent = name;
        document.getElementById('summaryAddress').textContent = flat + ', ' + street + ', ' + city + ' - ' + pin;
        document.getElementById('summaryPhone').textContent = '+91 ' + phone;
        document.getElementById('summaryEmail').textContent = auth.currentUser.email;
        document.getElementById('summaryAmount').textContent = '₹' + serviceInfo.price;
        showStep(3);
    } else {
        showStep(2);
    }
}

/* Firebase Magic Link Verification */
window.sendOTP = async function() {
    const email = document.getElementById('b_email').value.trim();
    if (!email || !email.includes('@') || !email.includes('.')) {
        alert('Please enter a valid email address.');
        return;
    }

    const sendBtn = document.getElementById('sendOtpBtn');
    sendBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Sending Link...';
    sendBtn.disabled = true;

    // Capture current booking data to restore later
    const pendingBooking = {
        name: document.getElementById('b_name').value,
        flat: document.getElementById('b_flat').value,
        street: document.getElementById('b_street').value,
        city: document.getElementById('b_city').value,
        pin: document.getElementById('b_pin').value,
        phone: document.getElementById('b_phone').value,
        service: document.getElementById('b_service').value,
        email: email
    };

    const actionCodeSettings = {
        url: window.location.href.split('?')[0] + '?booking_signin=true',
        handleCodeInApp: true,
    };

    try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        
        // Store data locally
        window.localStorage.setItem('emailForSignIn', email);
        window.localStorage.setItem('KAMWALLE_pending_booking', JSON.stringify(pendingBooking));

        document.getElementById('otpSection').classList.remove('hidden');
        sendBtn.innerHTML = 'Link Sent ✓ Check Email';
        alert('Magic login link sent to: ' + email + '\n\nPlease click the link in your email to continue your booking on this device.');
    } catch (error) {
        console.error('Firebase Auth Error:', error);
        alert('Error sending login link: ' + error.message);
        sendBtn.innerHTML = 'Send Magic Login Link <i class="ph ph-paper-plane-tilt"></i>';
        sendBtn.disabled = false;
    }
}

/**
 * Handles incoming Magic Link and restores booking state
 */
async function handleIncomingLink() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        const pendingBooking = JSON.parse(window.localStorage.getItem('KAMWALLE_pending_booking'));

        if (!email && pendingBooking) email = pendingBooking.email;

        if (!email) {
            email = window.prompt('Please provide your email for confirmation');
        }

        try {
            const result = await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            
            // If we have a pending booking, restore it and go to step 3
            if (pendingBooking) {
                // Open modal and populate data
                openBookingModal();
                restoreBookingData(pendingBooking);
                
                const serviceInfo = servicePrices[pendingBooking.service];
                document.getElementById('summaryService').textContent = serviceInfo.name;
                document.getElementById('summaryName').textContent = pendingBooking.name;
                document.getElementById('summaryAddress').textContent = pendingBooking.flat + ', ' + pendingBooking.street + ', ' + pendingBooking.city + ' - ' + pendingBooking.pin;
                document.getElementById('summaryPhone').textContent = '+91 ' + pendingBooking.phone;
                document.getElementById('summaryEmail').textContent = result.user.email;
                document.getElementById('summaryAmount').textContent = '₹' + serviceInfo.price;

                showStep(3);
                window.localStorage.removeItem('KAMWALLE_pending_booking');
            }
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error('Magic Link Error:', error);
            alert('Your login link has expired or is invalid. Please try again.');
        }
    }
}

function restoreBookingData(data) {
    document.getElementById('b_name').value = data.name;
    document.getElementById('b_flat').value = data.flat;
    document.getElementById('b_street').value = data.street;
    document.getElementById('b_city').value = data.city;
    document.getElementById('b_pin').value = data.pin;
    document.getElementById('b_phone').value = data.phone;
    document.getElementById('b_service').value = data.service;
    document.getElementById('b_email').value = data.email;
}

/* Back buttons */
window.goBackToStep1 = function() { showStep(1); }
window.goBackToStep2 = function() { showStep(2); }

/* Razorpay Payment */
const RAZORPAY_KEY = 'rzp_test_SQqH41QMQp0ejU'; // Integrated your Test API Key

window.initiateRazorpay = function() {
    const serviceKey = document.getElementById('b_service').value;
    const serviceInfo = servicePrices[serviceKey];
    const name = document.getElementById('b_name').value.trim();
    const phone = document.getElementById('b_phone').value.trim();
    const email = document.getElementById('b_email').value.trim();

    // Check if key is still a placeholder
    if (RAZORPAY_KEY === 'rzp_test_YourTestKeyHere') {
        const proceedWithMock = confirm(
            "RAZORPAY ERROR: You are using a placeholder Key ID.\n\n" +
            "To use real payments, please replace 'rzp_test_YourTestKeyHere' in script.js with your actual Key ID from Razorpay Dashboard.\n\n" +
            "Would you like to SIMULATE a successful payment for testing purposes?"
        );
        
        if (proceedWithMock) {
            handlePaymentSuccess({
                razorpay_payment_id: 'mock_payment_' + Date.now(),
                isMock: true
            }, serviceInfo, name, phone, email);
            return;
        }
        return;
    }

    const options = {
        key: RAZORPAY_KEY,
        amount: serviceInfo.price * 100, // Amount in paise
        currency: 'INR',
        name: 'KAMWALLE',
        description: serviceInfo.name,
        image: 'assets/kamwalle_logo.png',
        handler: function(response) {
            handlePaymentSuccess(response, serviceInfo, name, phone, email);
        },
        prefill: {
            name: name,
            email: email,
            contact: '+91' + phone,
        },
        theme: {
            color: '#0F62FE'
        },
        modal: {
            ondismiss: function() {
                console.log("Razorpay modal closed by user");
            }
        }
    };

    try {
        console.log("Initializing Razorpay with options:", options);
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function(response) {
            console.error("Razorpay Payment Failed:", response.error);
            alert('Payment failed. Please try again.\nReason: ' + response.error.description);
        });
        rzp.open();
    } catch (e) {
        console.error("Razorpay initialization error:", e);
        alert('Could not load Razorpay. Please check your internet connection or Key ID.');
    }
}

async function handlePaymentSuccess(response, serviceInfo, name, phone, email) {
    // Save booking locally for immediate feedback
    const booking = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        name: name,
        service: serviceInfo.name,
        address: document.getElementById('b_flat').value.trim() + ', ' + document.getElementById('b_street').value.trim() + ', ' + document.getElementById('b_city').value.trim() + ' - ' + document.getElementById('b_pin').value.trim(),
        phone: '+91 ' + phone,
        email: email,
        amount: serviceInfo.price,
        paymentId: response.razorpay_payment_id,
        status: 'paid'
    };
    
    const bookings = JSON.parse(localStorage.getItem('KAMWALLE_bookings')) || [];
    bookings.unshift(booking);
    localStorage.setItem('KAMWALLE_bookings', JSON.stringify(bookings));

    // Save to Firestore if user is logged in
    if (auth && auth.currentUser) {
        try {
            await setDoc(doc(db, "bookings", booking.id.toString()), {
                ...booking,
                userId: auth.currentUser.uid
            });
            console.log("Booking saved to Firestore");
        } catch (error) {
            console.error("Firestore booking save error:", error);
        }
    }

    alert(
        (response.isMock ? '[TEST MODE] ' : '') + 
        'Payment Successful! 🎉\n\n' +
        'Payment ID: ' + response.razorpay_payment_id + '\n\n' +
        'Your ' + serviceInfo.name + ' booking is confirmed. Our team will contact you shortly.'
    );
    closeBookingModal();
}

/* =======================================================
   Authentication Logic
   ======================================================= */

// Auth mode switching is now at the top

// Profile showing is now at the top

async function handleRegister(e) {
    e.preventDefault();
    console.log("Registration process initiated...");
    
    const name = document.getElementById('r_name').value.trim();
    const email = document.getElementById('r_email').value.trim();
    const phone = document.getElementById('r_phone').value.trim();
    const password = document.getElementById('r_password').value;
    const errorEl = document.getElementById('registerAuthError');

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.innerHTML : "Create Account";
    
    // Reset state
    if (errorEl) {
        errorEl.classList.add('hidden');
        errorEl.innerHTML = '';
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Creating Account...';
    }

    try {
        if (password.length < 6) {
            throw new Error("Password should be at least 6 characters long.");
        }

        console.log("Registering user in Firebase Auth:", email);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile in Auth
        await updateProfile(user, { displayName: name });

        // Save detailed data to Firestore
        console.log("Synchronizing user profile with Firestore...");
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            phone: phone,
            uid: user.uid,
            createdAt: new Date().toISOString()
        });
        
        console.log("Manual registration successful for UID:", user.uid);
        alert("Success! Your KAMWALLE account has been created.");
        closeAuthModal();
        
        // Form reset handled as modal closes or via manual reset if needed
        e.target.reset();
    } catch (error) {
        console.error("Manual Registration Error:", error.code, error.message);
        if (errorEl) {
            errorEl.innerHTML = `<i class="ph ph-warning-circle"></i> ${error.message}`;
            errorEl.classList.remove('hidden');
        } else {
            alert("Registration failed: " + error.message);
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    console.log("Login process initiated...");
    
    const email = document.getElementById('l_email').value.trim();
    const password = document.getElementById('l_password').value;
    const errorEl = document.getElementById('loginAuthError');

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.innerHTML : "Login";
    
    // Reset state
    if (errorEl) {
        errorEl.classList.add('hidden');
        errorEl.innerHTML = '';
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Authenticating...';
    }

    try {
        console.log("Authenticating with Firebase...");
        await signInWithEmailAndPassword(auth, email, password);
        
        console.log("Manual login successful.");
        closeAuthModal();
        e.target.reset();
        
        // Note: UI updates are handled automatically by onAuthStateChanged listener
    } catch (error) {
        console.error("Manual Login Error:", error.code, error.message);
        let userMsg = error.message;
        
        // User-friendly error mapping
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            userMsg = "Incorrect email or password. Please try again.";
        } else if (error.code === 'auth/too-many-requests') {
            userMsg = "Too many failed attempts. Access temporarily disabled. Please try later.";
        }

        if (errorEl) {
            errorEl.innerHTML = `<i class="ph ph-warning-circle"></i> ${userMsg}`;
            errorEl.classList.remove('hidden');
        } else {
            alert("Login failed: " + userMsg);
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

// Google login is now at the top

async function saveUserToFirestore(user) {
    if (!user) return;
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                name: user.displayName || 'Kamwalle User',
                email: user.email,
                phone: user.phoneNumber || 'N/A',
                uid: user.uid,
                createdAt: new Date().toISOString()
            });
            console.log("New user registered in Firestore");
        }
    } catch (err) {
        console.error("Error saving user to Firestore:", err);
    }
}

// Logout is now at the top

async function loadUserHistory(userId) {
    const historyList = document.getElementById('userHistoryList');
    if (!historyList) return;

    try {
        // We remove orderBy from the query to avoid the requirement for a composite index.
        // For user history, we can easily sort the results client-side.
        const q = query(
            collection(db, "bookings"), 
            where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            historyList.innerHTML = '<div class="history-empty">You haven\'t made any bookings yet.</div>';
            if (document.getElementById('historyCount')) document.getElementById('historyCount').textContent = '0 bookings';
            return;
        }

        // Convert docs to array and sort by id (timestamp) descending
        const bookings = [];
        querySnapshot.forEach((doc) => {
            bookings.push(doc.data());
        });
        
        // Sort newest first based on numeric id (Date.now())
        bookings.sort((a, b) => b.id - a.id);

        if (document.getElementById('historyCount')) document.getElementById('historyCount').textContent = bookings.length + ' bookings';

        let historyHtml = '';
        bookings.forEach((b) => {
            historyHtml += `
                <div class="history-item-new">
                    <div class="history-top">
                        <span class="service-badge">${b.service}</span>
                        <span class="price-tag">₹${b.amount}</span>
                    </div>
                    <div class="history-mid">
                        <i class="ph ph-calendar"></i> ${b.date}
                    </div>
                    <div class="history-bottom">
                        <span class="payment-id-badge">${b.paymentId || 'MOCK_PAY'}</span>
                        <span class="status-pill status-${b.status || 'paid'}">${(b.status || 'paid').toUpperCase()}</span>
                    </div>
                </div>
            `;
        });
        historyList.innerHTML = historyHtml;
    } catch (error) {
        console.error("Error loading history:", error);
        historyList.innerHTML = '<div class="history-empty">Error loading your history.</div>';
    }
}

// Close on overlay click
document.getElementById('authModalOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAuthModal();
});
