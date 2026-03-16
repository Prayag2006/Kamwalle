import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    deleteDoc, 
    doc,
    query,
    orderBy
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

document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Check if user is already authenticated in this session
    if(sessionStorage.getItem('KAMWALLE_admin_auth') === 'true') {
        showDashboard();
    }
    
    // Handle Login Submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwdInput = document.getElementById('adminPassword').value;
        
        if(pwdInput === ADMIN_PASSWORD) {
            sessionStorage.setItem('KAMWALLE_admin_auth', 'true');
            loginError.classList.add('hidden');
            showDashboard();
            document.getElementById('adminPassword').value = '';
        } else {
            loginError.classList.remove('hidden');
        }
    });
    
    // Handle Logout
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('KAMWALLE_admin_auth');
        loginScreen.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
    });
    
    function showDashboard() {
        loginScreen.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        loadContactData();
        loadBookingData();
        loadUserData();
    }
    
    // ---- Contact Requests ----
    function loadContactData() {
        const tbody = document.getElementById('contactTableBody');
        const totalRequests = document.getElementById('totalRequests');
        const tableContainer = document.querySelector('#tab-contacts .table-container');
        const emptyState = document.getElementById('emptyState');
        
        const contacts = JSON.parse(localStorage.getItem('KAMWALLE_contacts')) || [];
        totalRequests.textContent = contacts.length;
        
        if(contacts.length === 0) {
            tbody.innerHTML = '';
            tableContainer.style.display = 'none';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        tableContainer.style.display = 'block';
        
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
                    <button class="btn btn-sm btn-delete" onclick="window.deleteContact(${index})">
                        <i class="ph ph-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    window.deleteContact = function(index) {
        if(confirm("Delete this contact request?")) {
            const contacts = JSON.parse(localStorage.getItem('KAMWALLE_contacts')) || [];
            contacts.splice(index, 1);
            localStorage.setItem('KAMWALLE_contacts', JSON.stringify(contacts));
            loadContactData();
        }
    };

    // ---- Bookings ----
    async function loadBookingData() {
        const tbody = document.getElementById('bookingsTableBody');
        const totalBookings = document.getElementById('totalBookings');
        const tableContainer = document.getElementById('bookingsTableContainer');
        const emptyBookings = document.getElementById('emptyBookings');

        // Try to fetch from Firestore first, fallback to localStorage
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

        totalBookings.textContent = bookings.length;

        if(bookings.length === 0) {
            tbody.innerHTML = '';
            tableContainer.style.display = 'none';
            emptyBookings.classList.remove('hidden');
            return;
        }

        emptyBookings.classList.add('hidden');
        tableContainer.style.display = 'block';

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
                    <button class="btn btn-sm btn-delete" onclick="window.deleteBooking('${b.firestoreId || index}', ${!!b.firestoreId})">
                        <i class="ph ph-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    window.deleteBooking = async function(id, isFirestore) {
        if(confirm("Delete this booking?")) {
            if (isFirestore) {
                try {
                    await deleteDoc(doc(db, "bookings", id));
                } catch (err) {
                    console.error("Delete from Firestore Error:", err);
                }
            } else {
                const bookings = JSON.parse(localStorage.getItem('KAMWALLE_bookings')) || [];
                bookings.splice(id, 1);
                localStorage.setItem('KAMWALLE_bookings', JSON.stringify(bookings));
            }
            loadBookingData();
        }
    };

    // ---- Registered Users (Login Details) ----
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

        totalUsers.textContent = users.length;

        if(users.length === 0) {
            tbody.innerHTML = '';
            tableContainer.style.display = 'none';
            emptyUsers.classList.remove('hidden');
            return;
        }

        emptyUsers.classList.add('hidden');
        tableContainer.style.display = 'block';

        tbody.innerHTML = users.map((u, index) => `
            <tr>
                <td class="td-date">${u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}) : 'N/A'}</td>
                <td class="td-name"><strong>${u.name}</strong></td>
                <td class="td-contact">${u.email}</td>
                <td>${u.phone || 'N/A'}</td>
                <td><code style="font-size: 0.75rem; background: #eee; padding: 2px 4px; border-radius: 4px;">${u.uid || 'N/A'}</code></td>
                <td>
                    <button class="btn btn-sm btn-delete" onclick="window.deleteUser('${u.uid}')">
                        <i class="ph ph-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    window.deleteUser = async function(uid) {
        if(confirm("Are you sure you want to delete this user record from the dashboard? (Note: This does not delete their account from Firebase Auth)")) {
            try {
                await deleteDoc(doc(db, "users", uid));
                loadUserData();
            } catch (err) {
                alert("Error deleting user: " + err.message);
            }
        }
    };

    // Export switchTab to window
    window.switchTab = function(tab) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

        const tabEl = document.getElementById('tab-' + tab);
        if (tabEl) tabEl.classList.remove('hidden');

        // Update active button
        const buttons = document.querySelectorAll('.tab-btn');
        if (tab === 'contacts') buttons[0].classList.add('active');
        else if (tab === 'bookings') buttons[1].classList.add('active');
        else if (tab === 'users') buttons[2].classList.add('active');
        
        // Refresh data when switching
        if (tab === 'contacts') loadContactData();
        if (tab === 'bookings') loadBookingData();
        if (tab === 'users') loadUserData();
    }
});
