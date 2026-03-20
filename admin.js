import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    deleteDoc,
    addDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_PASSWORD = "KAMWALLEsecure123";

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
const db = getFirestore(app);

// ---- API EXPORTS (for HTML onclick) ----
window.switchTab = function (tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const tabEl = document.getElementById('tab-' + tab);
    if (tabEl) tabEl.classList.remove('hidden');

    // Update active button
    const buttons = document.querySelectorAll('.tab-btn');
    if (tab === 'contacts') buttons[0] && buttons[0].classList.add('active');
    else if (tab === 'bookings') buttons[1] && buttons[1].classList.add('active');
    else if (tab === 'users') buttons[2] && buttons[2].classList.add('active');
    else if (tab === 'reviews') buttons[3] && buttons[3].classList.add('active');

    // Refresh data when switching
    if (tab === 'contacts') loadContactData();
    if (tab === 'bookings') loadBookingData();
    if (tab === 'users') loadUserData();
    if (tab === 'reviews') loadReviewData();
};

window.openAdminReviewModal = function () {
    const modal = document.getElementById('adminReviewModal');
    if (modal) modal.classList.remove('hidden');
};

window.closeAdminReviewModal = function () {
    const modal = document.getElementById('adminReviewModal');
    const form = document.getElementById('adminReviewForm');
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
};

// --- CUSTOM POPUP LOGIC ---
window.showConfirm = function (title, message, icon = 'ph-warning-circle') {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const titleEl = document.getElementById('modalTitle');
        const msgEl = document.getElementById('modalMessage');
        const iconEl = document.getElementById('modalIcon');
        const cancelBtn = document.getElementById('modalCancelBtn');
        const confirmBtn = document.getElementById('modalConfirmBtn');

        titleEl.textContent = title;
        msgEl.textContent = message;
        iconEl.innerHTML = `<i class="ph ${icon}"></i>`;
        
        cancelBtn.classList.remove('hidden'); // Ensure cancel is visible
        modal.classList.remove('hidden');

        const cleanup = (result) => {
            modal.classList.add('hidden');
            cancelBtn.removeEventListener('click', onCancel);
            confirmBtn.removeEventListener('click', onConfirm);
            resolve(result);
        };

        const onCancel = () => cleanup(false);
        const onConfirm = () => cleanup(true);

        cancelBtn.addEventListener('click', onCancel);
        confirmBtn.addEventListener('click', onConfirm);
    });
};

window.showAlert = function (title, message, icon = 'ph-check-circle') {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const titleEl = document.getElementById('modalTitle');
        const msgEl = document.getElementById('modalMessage');
        const iconEl = document.getElementById('modalIcon');
        const cancelBtn = document.getElementById('modalCancelBtn');
        const confirmBtn = document.getElementById('modalConfirmBtn');

        titleEl.textContent = title;
        msgEl.textContent = message;
        iconEl.innerHTML = `<i class="ph ${icon}"></i>`;
        
        cancelBtn.classList.add('hidden'); // Hide cancel for alerts
        modal.classList.remove('hidden');

        const onConfirm = () => {
            modal.classList.add('hidden');
            confirmBtn.removeEventListener('click', onConfirm);
            resolve();
        };

        confirmBtn.addEventListener('click', onConfirm);
    });
};

// ---- DOM LOADED EVENT ----
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    // Check if user is already authenticated in this session
    if (sessionStorage.getItem('KAMWALLE_admin_auth') === 'true') {
        showDashboard();
    }

    // Handle Login Submit
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pwdInput = document.getElementById('adminPassword').value;

            if (pwdInput === ADMIN_PASSWORD) {
                sessionStorage.setItem('KAMWALLE_admin_auth', 'true');
                if (loginError) loginError.classList.add('hidden');
                showDashboard();
                document.getElementById('adminPassword').value = '';
            } else {
                if (loginError) loginError.classList.remove('hidden');
            }
        });
    }

    // Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('KAMWALLE_admin_auth');
            const loginScreen = document.getElementById('login-screen');
            const adminDashboard = document.getElementById('admin-dashboard');
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (adminDashboard) adminDashboard.classList.add('hidden');
        });
    }

    // Admin Review Form Submit
    const adminReviewForm = document.getElementById('adminReviewForm');
    if (adminReviewForm) {
        adminReviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('adminRevSubmitBtn');
            const name = document.getElementById('adminRevName').value;
            const rating = parseInt(document.getElementById('adminRevRating').value);
            const text = document.getElementById('adminRevText').value;

            try {
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Posting...';
                }

                await addDoc(collection(db, "reviews"), {
                    name,
                    rating,
                    review: text,
                    text: text,
                    createdAt: serverTimestamp(),
                    verified: true,
                    isManual: true
                });

                await showAlert("Review Posted", "Manual review has been successfully added to Firestore.");
                window.closeAdminReviewModal();
                await loadReviewData(true);
            } catch (err) {
                await showAlert("Error", err.message, "ph-warning-circle");
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="ph ph-paper-plane-tilt"></i> Post Review to Firestore';
                }
            }
        });
    }

    // Attach internal functions to window for any dynamic calls if needed
    window.loadReviewData = loadReviewData;
    window.deleteContact = deleteContact;
    window.deleteBooking = deleteBooking;
    window.deleteUser = deleteUser;
    window.deleteReview = deleteReview;
});

// ---- DATA LOADING FUNCTIONS ----

async function showDashboard() {
    const loginScreen = document.getElementById('login-screen');
    const adminDashboard = document.getElementById('admin-dashboard');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (adminDashboard) adminDashboard.classList.remove('hidden');
    loadContactData();
    loadBookingData();
    loadUserData();
    loadReviewData();
}

async function loadContactData() {
    const tbody = document.getElementById('contactTableBody');
    const totalRequests = document.getElementById('totalRequests');
    const tableContainer = document.querySelector('#tab-contacts .table-container');
    const emptyState = document.getElementById('emptyState');

    const contacts = JSON.parse(localStorage.getItem('KAMWALLE_contacts')) || [];
    if (totalRequests) totalRequests.textContent = contacts.length;

    if (contacts.length === 0) {
        if (tbody) tbody.innerHTML = '';
        if (tableContainer) tableContainer.style.display = 'none';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (tableContainer) tableContainer.style.display = 'block';

    if (tbody) {
        tbody.innerHTML = contacts.map((contact, index) => `
            <tr>
                <td class="td-date">${contact.date}</td>
                <td class="td-name"><strong>${contact.name}</strong></td>
                <td class="td-contact">
                    <div><i class="ph ph-envelope-simple"></i> ${contact.email}</div>
                    <div style="margin-top: 4px; color: var(--text-main)"><i class="ph ph-phone"></i> ${contact.phone}</div>
                </td>
                <td class="td-address">
                    <p style="margin-bottom: 6px;">${contact.address}</p>
                    <span class="postal-tag">PIN: ${contact.postal}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-delete" data-contact-index="${index}" type="button">
                        <i class="ph ph-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('#contactTableBody .btn-delete').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const index = parseInt(this.getAttribute('data-contact-index'));
                deleteContact(index, this);
            });
        });
    }
}

async function deleteContact(index, btnElement) {
    const confirmed = await showConfirm("Delete Contact Request?", "Are you sure you want to remove this contact submission?");
    if (confirmed) {
        if (btnElement) {
            btnElement.disabled = true;
            btnElement.innerHTML = '<i class="ph ph-spinner ph-spin"></i>...';
        }
        const contacts = JSON.parse(localStorage.getItem('KAMWALLE_contacts')) || [];
        contacts.splice(index, 1);
        localStorage.setItem('KAMWALLE_contacts', JSON.stringify(contacts));
        await loadContactData();
        await showAlert("Success", "Contact request deleted.");
    }
}

async function loadBookingData() {
    const tbody = document.getElementById('bookingsTableBody');
    const totalBookings = document.getElementById('totalBookings');
    const tableContainer = document.getElementById('bookingsTableContainer');
    const emptyBookings = document.getElementById('emptyBookings');

    let bookings = [];
    try {
        const q = query(collection(db, "bookings"), orderBy("id", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            bookings.push({ ...doc.data(), firestoreId: doc.id });
        });
    } catch (error) {
        console.warn("Firestore fetch error, using local storage:", error);
        bookings = JSON.parse(localStorage.getItem('KAMWALLE_bookings')) || [];
    }

    if (totalBookings) totalBookings.textContent = bookings.length;

    if (bookings.length === 0) {
        if (tbody) tbody.innerHTML = '';
        if (tableContainer) tableContainer.style.display = 'none';
        if (emptyBookings) emptyBookings.classList.remove('hidden');
        return;
    }

    if (emptyBookings) emptyBookings.classList.add('hidden');
    if (tableContainer) tableContainer.style.display = 'block';

    if (tbody) {
        tbody.innerHTML = bookings.map((b, index) => `
            <tr>
                <td class="td-date">${b.date}</td>
                <td class="td-name"><strong>${b.name}</strong></td>
                <td>${b.service}</td>
                <td class="td-address">${b.address}</td>
                <td class="td-contact">
                    <div><i class="ph ph-envelope-simple"></i> ${b.email || 'N/A'}</div>
                    <div style="margin-top: 4px; color: var(--text-main)"><i class="ph ph-phone"></i> ${b.phone}</div>
                </td>
                <td><strong class="amount-tag">₹${b.amount}</strong></td>
                <td><span class="payment-id-tag">${b.paymentId || 'N/A'}</span></td>
                <td><span class="status-badge status-${b.status || 'paid'}">${(b.status || 'paid').toUpperCase()}</span></td>
                <td>
                    <button class="btn btn-sm btn-delete" data-booking-id="${String(b.firestoreId || index).replace(/"/g, '&quot;')}" data-is-firestore="${!!b.firestoreId}" type="button">
                        <i class="ph ph-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('#bookingsTableBody .btn-delete').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const bookingId = this.getAttribute('data-booking-id');
                const isFirestore = this.getAttribute('data-is-firestore') === 'true';
                deleteBooking(bookingId, isFirestore, this);
            });
        });
    }
}

async function deleteBooking(id, isFirestore, btnElement) {
    const confirmed = await showConfirm("Delete Booking?", "Are you sure you want to remove this service booking?");
    if (confirmed) {
        if (btnElement) {
            btnElement.disabled = true;
            btnElement.innerHTML = '<i class="ph ph-spinner ph-spin"></i>...';
        }
        if (isFirestore) {
            try {
                await deleteDoc(doc(db, "bookings", id));
            } catch (err) {
                console.error("Delete from Firestore Error:", err);
                await showAlert("Error", err.message, "ph-warning-circle");
            }
        } else {
            const bookings = JSON.parse(localStorage.getItem('KAMWALLE_bookings')) || [];
            bookings.splice(id, 1);
            localStorage.setItem('KAMWALLE_bookings', JSON.stringify(bookings));
        }
        await loadBookingData();
    }
}

async function loadUserData() {
    const tbody = document.getElementById('usersTableBody');
    const totalUsers = document.getElementById('totalUsers');
    const tableContainer = document.getElementById('usersTableContainer');
    const emptyUsers = document.getElementById('emptyUsers');

    let users = [];
    try {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            users.push(doc.data());
        });
    } catch (error) {
        console.error("Firestore user fetch error:", error);
    }

    if (totalUsers) totalUsers.textContent = users.length;

    if (users.length === 0) {
        if (tbody) tbody.innerHTML = '';
        if (tableContainer) tableContainer.style.display = 'none';
        if (emptyUsers) emptyUsers.classList.remove('hidden');
        return;
    }

    if (emptyUsers) emptyUsers.classList.add('hidden');
    if (tableContainer) tableContainer.style.display = 'block';

    if (tbody) {
        tbody.innerHTML = users.map((u, index) => `
            <tr>
                <td class="td-date">${u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
                <td class="td-name"><strong>${u.name}</strong></td>
                <td class="td-contact">${u.email}</td>
                <td>${u.phone || 'N/A'}</td>
                <td><code style="font-size: 0.75rem; background: #eee; padding: 2px 4px; border-radius: 4px;">${u.uid || 'N/A'}</code></td>
                <td>
                    <button class="btn btn-sm btn-delete" data-user-uid="${String(u.uid).replace(/"/g, '&quot;')}" type="button">
                        <i class="ph ph-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('#usersTableBody .btn-delete').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const uid = this.getAttribute('data-user-uid');
                deleteUser(uid, this);
            });
        });
    }
}

async function deleteUser(uid, btnElement) {
    const confirmed = await showConfirm("Delete User Record?", "Are you sure you want to delete this user record from the dashboard? (Note: This does not delete their account from Firebase Auth)");
    if (confirmed) {
        try {
            if (btnElement) {
                btnElement.disabled = true;
                btnElement.innerHTML = '<i class="ph ph-spinner ph-spin"></i>...';
            }
            await deleteDoc(doc(db, "users", uid));
            await loadUserData();
        } catch (err) {
            await showAlert("Error", err.message, "ph-warning-circle");
            await loadUserData();
        }
    }
}

async function loadReviewData(forceSync = false) {
    const tbody = document.getElementById('reviewsTableBody');
    const emptyReviews = document.getElementById('emptyReviews');
    const tableContainer = document.getElementById('reviewsTableContainer');
    const totalStat = document.getElementById('totalReviewStat');

    if (!tbody) return;

    if (forceSync) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;"><i class="ph ph-arrows-counter-clockwise ph-spin"></i> Syncing...</td></tr>';
    }

    let firestoreReviews = [];
    try {
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            firestoreReviews.push({ ...data, firestoreId: doc.id, isFromFirestore: true });
        });
    } catch (error) {
        console.error("Firestore fetch error:", error);
    }

    let localReviews = JSON.parse(localStorage.getItem('KAMWALLE_reviews')) || [];
    const firestoreCheckSet = new Set(firestoreReviews.map(r => `${r.name}_${r.rating}_${(r.review || r.text || "").substring(0, 20)}`));

    const uniqueLocalReviews = localReviews.filter((lr, idx) => {
        const key = `${lr.name}_${lr.rating}_${(lr.review || lr.text || "").substring(0, 20)}`;
        return !firestoreCheckSet.has(key);
    });

    const allReviews = [
        ...firestoreReviews,
        ...uniqueLocalReviews.map((r, idx) => ({ ...r, localId: idx, isFromFirestore: false }))
    ];

    if (totalStat) totalStat.textContent = allReviews.length;

    if (allReviews.length === 0) {
        tbody.innerHTML = '';
        if (tableContainer) tableContainer.style.display = 'none';
        if (emptyReviews) emptyReviews.classList.remove('hidden');
        return;
    }

    if (emptyReviews) emptyReviews.classList.add('hidden');
    if (tableContainer) tableContainer.style.display = 'block';

    tbody.innerHTML = allReviews.map((r, index) => {
        const dateObj = r.createdAt ? (r.createdAt.seconds ? new Date(r.createdAt.seconds * 1000) : new Date(r.createdAt)) : new Date();
        const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const idToPass = r.firestoreId || r.localId;
        const isFS = !!r.isFromFirestore;

        return `
            <tr class="${!isFS ? 'local-row' : ''}" style="${!isFS ? 'background: #fffcf0;' : ''}">
                <td class="td-date">${dateStr} ${!isFS ? '<span class="badge-local" style="font-size: 0.7rem; background: #fee2e2; color: #b91c1c; padding: 1px 4px; border-radius: 4px; margin-left: 5px;">Local Only</span>' : ''}</td>
                <td class="td-name"><strong>${r.name}</strong> ${isFS ? '<i class="ph-fill ph-check-circle" style="color: #16a34a; font-size: 0.8rem;" title="Synced with Database"></i>' : ''}</td>
                <td>
                    <div style="color: #ffc107;">
                        ${'★'.repeat(r.rating || 0)}${'☆'.repeat(5 - (r.rating || 0))}
                    </div>
                </td>
                <td style="max-width: 300px; font-size: 0.9rem;">${r.review || r.text || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-delete" data-review-id="${String(idToPass).replace(/"/g, '&quot;')}" data-is-firestore="${isFS}" type="button">
                        <i class="ph ph-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    document.querySelectorAll('#reviewsTableBody .btn-delete').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const reviewId = this.getAttribute('data-review-id');
            const isFirestore = this.getAttribute('data-is-firestore') === 'true';
            deleteReview(reviewId, isFirestore, this);
        });
    });
}

async function deleteReview(id, isFirestore, btnElement) {
    if (id === undefined || id === null || id === "") return;
    const confirmed = await showConfirm("Delete Review?", "Are you sure you want to delete this customer review?");
    if (confirmed) {
        try {
            if (btnElement) {
                btnElement.disabled = true;
                btnElement.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Deleting...';
            }
            if (isFirestore) {
                await deleteDoc(doc(db, "reviews", id));
            } else {
                let reviews = JSON.parse(localStorage.getItem('KAMWALLE_reviews')) || [];
                const idx = parseInt(id);
                if (!isNaN(idx)) {
                    reviews.splice(idx, 1);
                    localStorage.setItem('KAMWALLE_reviews', JSON.stringify(reviews));
                }
            }
            await loadReviewData();
            await showAlert("Deleted", "The review has been removed.");
        } catch (err) {
            console.error("Delete Error:", err);
            await showAlert("Error", err.message, "ph-warning-circle");
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = '<i class="ph ph-trash"></i> Delete';
            }
        }
    }
}
