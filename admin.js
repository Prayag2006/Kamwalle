import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    getDoc,
    deleteDoc,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
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

// --- Cloudinary Config ---
const CLOUDINARY_CLOUD_NAME = "dy3b509jd";
const CLOUDINARY_UPLOAD_PRESET = "AdharCard"; // Updated from screenshot

// --- Cloudinary Upload Helper ---
const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: formData
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Cloudinary upload failed");
    }

    const data = await res.json();
    return data.secure_url;
};

// ---- API EXPORTS (for HTML onclick) ----
window.switchTab = function (tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    const tabEl = document.getElementById('tab-' + tab);
    if (tabEl) tabEl.classList.remove('hidden');

    // Update active button
    const navItems = document.querySelectorAll('.nav-item');
    if (tab === 'contacts') navItems[0] && navItems[0].classList.add('active');
    else if (tab === 'bookings') navItems[1] && navItems[1].classList.add('active');
    else if (tab === 'users') navItems[2] && navItems[2].classList.add('active');
    else if (tab === 'customers') navItems[3] && navItems[3].classList.add('active');
    else if (tab === 'workers') navItems[4] && navItems[4].classList.add('active');
    else if (tab === 'reviews') navItems[5] && navItems[5].classList.add('active');

    // Update UI Titles
    const titleEl = document.getElementById('currentSectionTitle');
    const descEl = document.getElementById('currentSectionDesc');
    
    if (tab === 'contacts') {
        if (titleEl) titleEl.textContent = "Contact Requests";
        if (descEl) descEl.textContent = "Manage customer inquiries and messages.";
    } else if (tab === 'bookings') {
        if (titleEl) titleEl.textContent = "Service Bookings";
        if (descEl) descEl.textContent = "Track and manage maid service bookings.";
    } else if (tab === 'users') {
        if (titleEl) titleEl.textContent = "Registered Users";
        if (descEl) descEl.textContent = "View and manage registered customer accounts.";
    } else if (tab === 'customers') {
        if (titleEl) titleEl.textContent = "Customer Database";
        if (descEl) descEl.textContent = "Manage manually added customer details.";
    } else if (tab === 'workers') {
        if (titleEl) titleEl.textContent = "Worker Database";
        if (descEl) descEl.textContent = "Manage worker profiles and service details.";
    } else if (tab === 'reviews') {
        if (titleEl) titleEl.textContent = "Customer Reviews";
        if (descEl) descEl.textContent = "Monitor and moderate customer feedback.";
    }

    // Close sidebar on mobile
    const adminSidebar = document.getElementById('adminSidebar');
    if (adminSidebar) adminSidebar.classList.remove('active');

    // Refresh data when switching
    if (tab === 'contacts') loadContactData();
    if (tab === 'bookings') loadBookingData();
    if (tab === 'users') loadUserData();
    if (tab === 'customers') loadCustomerData();
    if (tab === 'workers') loadWorkerData();
    if (tab === 'reviews') loadReviewData();
};

window.handleAdminLogout = function () {
    sessionStorage.removeItem('KAMWALLE_admin_auth');
    location.reload();
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

window.openAddCustomerModal = async function () {
    const modal = document.getElementById('addCustomerModal');
    if (modal) {
        document.getElementById('addCustomerForm').reset();
        
        // Populate workers dropdown
        const workerSelect = document.getElementById('addCustWorker');
        if (workerSelect) {
            workerSelect.innerHTML = '<option value="">-- No Worker Assigned --</option>';
            try {
                const q = query(collection(db, "workers"), orderBy("name", "asc"));
                const qs = await getDocs(q);
                qs.forEach(wDoc => {
                    const w = wDoc.data();
                    const opt = document.createElement('option');
                    opt.value = wDoc.id;
                    opt.textContent = `${w.name} (${w.service || 'N/A'})`;
                    workerSelect.appendChild(opt);
                });
            } catch (err) {
                console.error("Error populating workers dropdown for add customer:", err);
            }
        }

        modal.classList.remove('hidden');
    }
};

window.closeAddCustomerModal = function () {
    const modal = document.getElementById('addCustomerModal');
    const form = document.getElementById('addCustomerForm');
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
};

window.openAddWorkerModal = function () {
    const modal = document.getElementById('addWorkerModal');
    if (modal) modal.classList.remove('hidden');
};

window.closeAddWorkerModal = function () {
    const modal = document.getElementById('addWorkerModal');
    const form = document.getElementById('addWorkerForm');
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
};

let currentViewingCustomer = null;
let currentViewingWorker = null;
window.allWorkersData = {};

window.viewWorkerDetails = async function (name, phone, service, exp, address, note, id, isFirestore) {
    const modal = document.getElementById('viewWorkerModal');
    if (modal) {
        const decodedName = decodeURIComponent(name);
        const decodedPhone = decodeURIComponent(phone);
        const decodedService = decodeURIComponent(service);
        const decodedExp = decodeURIComponent(exp);
        const decodedAddress = decodeURIComponent(address);
        const decodedNote = decodeURIComponent(note);

        currentViewingWorker = { 
            name: decodedName, 
            phone: decodedPhone, 
            service: decodedService,
            exp: decodedExp,
            address: decodedAddress, 
            note: decodedNote, 
            id, 
            isFirestore: isFirestore === 'true' || isFirestore === true,
            docType: isFirestore ? (window.allWorkersData && window.allWorkersData[id] ? window.allWorkersData[id].docType : '') : '',
            docUrl: isFirestore ? (window.allWorkersData && window.allWorkersData[id] ? window.allWorkersData[id].docUrl : '') : ''
        };

        if (document.getElementById('viewWorkName')) document.getElementById('viewWorkName').innerHTML = `<span>${decodedName || 'N/A'}</span>`;
        if (document.getElementById('viewWorkPhone')) document.getElementById('viewWorkPhone').textContent = decodedPhone || 'N/A';
        if (document.getElementById('viewWorkService')) document.getElementById('viewWorkService').textContent = decodedService || 'N/A';
        if (document.getElementById('viewWorkExp')) document.getElementById('viewWorkExp').textContent = decodedExp || '0';
        if (document.getElementById('viewWorkAddress')) document.getElementById('viewWorkAddress').textContent = decodedAddress || 'No address provided.';
        const noteEl = document.getElementById('viewWorkNote');
        if (noteEl) noteEl.textContent = decodedNote && decodedNote !== 'undefined' && decodedNote !== '' ? decodedNote : 'No additional notes or instructions provided for this worker.';
        
        // Show Document if available
        const docSection = document.getElementById('viewWorkDocSection');
        if (docSection) {
            const workerData = window.allWorkersData[id] || {};
            const docType = workerData.docType || currentViewingWorker.docType;
            const docUrl = workerData.docUrl || currentViewingWorker.docUrl;

            if (docUrl) {
                docSection.style.display = 'block';
                document.getElementById('viewWorkDocType').textContent = docType || 'Worker Document';
                document.getElementById('viewWorkDocLink').href = docUrl;
            } else {
                docSection.style.display = 'none';
            }
        }
        
        // Fetch Assigned Customers
        const customerListEl = document.getElementById('viewWorkCustomerList');
        if (customerListEl) {
            customerListEl.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);"><i class="ph ph-spinner ph-spin"></i> Loading assigned customers...</div>';
            try {
                // Query customers where workerId matches this worker's ID
                const q = query(collection(db, "customers"), where("workerId", "==", id));
                const qs = await getDocs(q);
                
                if (qs.empty) {
                    customerListEl.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); background: #f8fafc; border-radius: 12px; border: 1px dashed #e2e8f0;">No customers assigned to this worker yet.</div>';
                } else {
                    customerListEl.innerHTML = '';
                    qs.forEach(cDoc => {
                        const c = cDoc.data();
                        const item = document.createElement('div');
                        item.className = 'assigned-customer-item';
                        item.innerHTML = `
                            <div class="cust-info">
                                <div class="cust-name">${c.name}</div>
                                <div class="cust-phone"><i class="ph ph-phone"></i> ${c.phone}</div>
                            </div>
                            <button class="btn btn-sm btn-outline" onclick="window.closeViewWorkerModal(); window.viewCustomerDetails('${encodeURIComponent(c.name)}', '${encodeURIComponent(c.phone)}', '${encodeURIComponent(c.address)}', '${encodeURIComponent(c.note)}', '${cDoc.id}', 'true', '${id}')">
                                View Profile
                            </button>
                        `;
                        customerListEl.appendChild(item);
                    });
                }
            } catch (err) {
                console.error("Error fetching worker customers:", err);
                customerListEl.innerHTML = '<div style="padding: 1rem; color: #ef4444; font-size: 0.9rem;">Error loading assigned customers list.</div>';
            }
        }

        modal.classList.remove('hidden');
    }
};

window.openEditWorkerModal = function () {
    if (!currentViewingWorker) return;
    
    document.getElementById('editWorkName').value = currentViewingWorker.name;
    document.getElementById('editWorkPhone').value = currentViewingWorker.phone;
    document.getElementById('editWorkService').value = currentViewingWorker.service || 'Cleaning';
    document.getElementById('editWorkExp').value = currentViewingWorker.exp || '';
    document.getElementById('editWorkAddress').value = currentViewingWorker.address;
    document.getElementById('editWorkNote').value = currentViewingWorker.note === 'undefined' ? '' : currentViewingWorker.note;
    
    if (document.getElementById('editWorkDocType')) {
        document.getElementById('editWorkDocType').value = currentViewingWorker.docType || 'Aadhar Card';
    }
    
    document.getElementById('viewWorkerModal').classList.add('hidden');
    document.getElementById('editWorkerModal').classList.remove('hidden');
};

window.closeEditWorkerModal = function () {
    document.getElementById('editWorkerModal').classList.add('hidden');
    document.getElementById('viewWorkerModal').classList.remove('hidden');
};

window.closeViewWorkerModal = function () {
    const modal = document.getElementById('viewWorkerModal');
    if (modal) modal.classList.add('hidden');
};

window.viewCustomerDetails = async function (name, phone, address, note, id, isFirestore, workerId) {
    const modal = document.getElementById('viewCustomerModal');
    if (modal) {
        const decodedName = decodeURIComponent(name);
        const decodedPhone = decodeURIComponent(phone);
        const decodedAddress = decodeURIComponent(address);
        const decodedNote = decodeURIComponent(note);
        const decodedWorkerId = decodeURIComponent(workerId || '');

        currentViewingCustomer = { 
            name: decodedName, 
            phone: decodedPhone, 
            address: decodedAddress, 
            note: decodedNote, 
            id, 
            isFirestore: isFirestore === 'true' || isFirestore === true,
            workerId: decodedWorkerId
        };

        document.getElementById('viewCustName').innerHTML = `<span>${decodedName || 'N/A'}</span>`;
        document.getElementById('viewCustPhone').textContent = decodedPhone || 'N/A';
        document.getElementById('viewCustAddress').textContent = decodedAddress || 'No address provided.';
        document.getElementById('viewCustNote').textContent = decodedNote && decodedNote !== 'undefined' && decodedNote !== '' ? decodedNote : 'No additional notes or instructions provided for this customer.';
        
        // Handle Assigned Worker Display
        const workerSection = document.getElementById('viewCustWorkerSection');
        if (decodedWorkerId) {
            workerSection.style.display = 'block';
            document.getElementById('viewCustWorkerName').textContent = 'Loading worker...';
            document.getElementById('viewCustWorkerService').querySelector('span').textContent = '...';
            document.getElementById('viewCustWorkerPhone').querySelector('span').textContent = '...';
            
            try {
                const workerDoc = await getDoc(doc(db, "workers", decodedWorkerId));
                if (workerDoc.exists()) {
                    const w = workerDoc.data();
                    document.getElementById('viewCustWorkerName').textContent = w.name || 'Unknown Worker';
                    document.getElementById('viewCustWorkerService').querySelector('span').textContent = w.service || 'N/A';
                    document.getElementById('viewCustWorkerPhone').querySelector('span').textContent = w.phone || 'N/A';
                } else {
                    document.getElementById('viewCustWorkerName').textContent = 'Worker not found';
                }
            } catch (err) {
                console.error("Error fetching worker for customer view:", err);
                document.getElementById('viewCustWorkerName').textContent = 'Error loading worker';
            }
        } else {
            workerSection.style.display = 'none';
        }

        modal.classList.remove('hidden');
    }
};

window.openEditCustomerModal = async function () {
    if (!currentViewingCustomer) return;
    
    document.getElementById('editCustName').value = currentViewingCustomer.name;
    document.getElementById('editCustPhone').value = currentViewingCustomer.phone;
    document.getElementById('editCustAddress').value = currentViewingCustomer.address;
    document.getElementById('editCustNote').value = currentViewingCustomer.note === 'undefined' ? '' : currentViewingCustomer.note;
    
    // Populate workers dropdown
    const workerSelect = document.getElementById('editCustWorker');
    if (workerSelect) {
        workerSelect.innerHTML = '<option value="">-- No Worker Assigned --</option>';
        try {
            const q = query(collection(db, "workers"), orderBy("name", "asc"));
            const qs = await getDocs(q);
            qs.forEach(wDoc => {
                const w = wDoc.data();
                const opt = document.createElement('option');
                opt.value = wDoc.id;
                opt.textContent = `${w.name} (${w.service || 'N/A'})`;
                workerSelect.appendChild(opt);
            });
            // Set current assigned worker
            workerSelect.value = currentViewingCustomer.workerId || '';
        } catch (err) {
            console.error("Error populating workers dropdown:", err);
        }
    }

    document.getElementById('viewCustomerModal').classList.add('hidden');
    document.getElementById('editCustomerModal').classList.remove('hidden');
};

window.closeEditCustomerModal = function () {
    document.getElementById('editCustomerModal').classList.add('hidden');
    document.getElementById('viewCustomerModal').classList.remove('hidden');
};

window.closeViewCustomerModal = function () {
    const modal = document.getElementById('viewCustomerModal');
    if (modal) modal.classList.add('hidden');
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
    const logoutBtnSidebar = document.getElementById('logoutBtnSidebar');

    if (logoutBtnSidebar) {
        logoutBtnSidebar.addEventListener('click', handleAdminLogout);
    }

    // Sidebar Toggle
    const toggleSidebar = document.getElementById('toggleSidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const adminSidebar = document.getElementById('adminSidebar');

    if (toggleSidebar && adminSidebar) {
        toggleSidebar.addEventListener('click', () => {
            adminSidebar.classList.add('active');
        });
    }

    if (closeSidebar && adminSidebar) {
        closeSidebar.addEventListener('click', () => {
            adminSidebar.classList.remove('active');
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

    // Add Customer Form Submit
    const addCustomerForm = document.getElementById('addCustomerForm');
    if (addCustomerForm) {
        addCustomerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('addCustSubmitBtn');
            const name = document.getElementById('addCustName').value;
            const phone = document.getElementById('addCustPhone').value;
            const address = document.getElementById('addCustAddress').value;
            const note = document.getElementById('addCustNote').value;

            try {
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Saving...';
                }

                const workerIdValue = document.getElementById('addCustWorker').value;

                await addDoc(collection(db, "customers"), {
                    name,
                    phone,
                    address,
                    note,
                    workerId: workerIdValue,
                    createdAt: serverTimestamp()
                });

                await showAlert("Customer Added", "Customer details have been successfully saved.");
                window.closeAddCustomerModal();
                await loadCustomerData(true);
            } catch (err) {
                console.error("Error adding customer:", err);
                // Fallback to local storage if Firestore fails
                const workerIdValue = document.getElementById('addCustWorker').value;
                const localCustomers = JSON.parse(localStorage.getItem('KAMWALLE_customers')) || [];
                localCustomers.push({
                    name, phone, address, note, workerId: workerIdValue, createdAt: new Date().toISOString()
                });
                localStorage.setItem('KAMWALLE_customers', JSON.stringify(localCustomers));
                
                await showAlert("Saved Locally", "Customer saved to local storage (Firestore error).");
                window.closeAddCustomerModal();
                await loadCustomerData(true);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Save Customer';
                }
            }
        });
    }

    // Edit Customer Form Submit
    const editCustomerForm = document.getElementById('editCustomerForm');
    if (editCustomerForm) {
        editCustomerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentViewingCustomer) return;

            const name = document.getElementById('editCustName').value;
            const phone = document.getElementById('editCustPhone').value;
            const address = document.getElementById('editCustAddress').value;
            const note = document.getElementById('editCustNote').value;

            try {
                const saveBtn = editCustomerForm.querySelector('button[type="submit"]');
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Saving...';
                }

                const workerIdSelection = document.getElementById('editCustWorker').value;

                if (currentViewingCustomer.isFirestore) {
                    await updateDoc(doc(db, "customers", currentViewingCustomer.id), {
                        name, phone, address, note,
                        workerId: workerIdSelection,
                        updatedAt: serverTimestamp()
                    });
                } else {
                    let customers = JSON.parse(localStorage.getItem('KAMWALLE_customers')) || [];
                    const idx = parseInt(currentViewingCustomer.id);
                    if (!isNaN(idx)) {
                        customers[idx] = { 
                            ...customers[idx], 
                            name, phone, address, note,
                            workerId: workerIdSelection,
                            updatedAt: new Date().toISOString()
                        };
                        localStorage.setItem('KAMWALLE_customers', JSON.stringify(customers));
                    }
                }

                await showAlert("Updated", "Customer details have been successfully updated.");
                document.getElementById('editCustomerModal').classList.add('hidden');
                await loadCustomerData(true);
            } catch (err) {
                console.error("Update Error:", err);
                await showAlert("Error", err.message, "ph-warning-circle");
            } finally {
                const saveBtn = editCustomerForm.querySelector('button[type="submit"]');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Save Changes';
                }
            }
        });
    }

    // Add Worker Form Submit
    const addWorkerForm = document.getElementById('addWorkerForm');
    if (addWorkerForm) {
        addWorkerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('addWorkSubmitBtn');
            const name = document.getElementById('addWorkName').value;
            const phone = document.getElementById('addWorkPhone').value;
            const service = document.getElementById('addWorkService').value;
            const exp = document.getElementById('addWorkExp').value;
            const address = document.getElementById('addWorkAddress').value;
            const note = document.getElementById('addWorkNote').value;

            try {
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Saving...';
                }

                const docType = document.getElementById('addWorkDocType').value;
                const fileInput = document.getElementById('addWorkFile');
                let docUrl = "";

                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    docUrl = await uploadToCloudinary(file);
                }

                await addDoc(collection(db, "workers"), {
                    name, phone, service, exp, address, note,
                    docType, docUrl,
                    createdAt: serverTimestamp()
                });

                await showAlert("Worker Added", "Worker details have been successfully saved.");
                window.closeAddWorkerModal();
                await loadWorkerData(true);
            } catch (err) {
                console.error("Error adding worker:", err);
                await showAlert("Error", err.message, "ph-warning-circle");
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Save Worker';
                }
            }
        });
    }

    // Edit Worker Form Submit
    const editWorkerForm = document.getElementById('editWorkerForm');
    if (editWorkerForm) {
        editWorkerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentViewingWorker) return;

            const name = document.getElementById('editWorkName').value;
            const phone = document.getElementById('editWorkPhone').value;
            const service = document.getElementById('editWorkService').value;
            const exp = document.getElementById('editWorkExp').value;
            const address = document.getElementById('editWorkAddress').value;
            const note = document.getElementById('editWorkNote').value;

            try {
                const saveBtn = editWorkerForm.querySelector('button[type="submit"]');
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Saving...';
                }

                if (currentViewingWorker.isFirestore) {
                    const docType = document.getElementById('editWorkDocType').value;
                    const fileInput = document.getElementById('editWorkFile');
                    let docUrl = currentViewingWorker.docUrl || "";

                    if (fileInput.files.length > 0) {
                        const file = fileInput.files[0];
                        docUrl = await uploadToCloudinary(file);
                    }

                    await updateDoc(doc(db, "workers", currentViewingWorker.id), {
                        name, phone, service, exp, address, note,
                        docType, docUrl,
                        updatedAt: serverTimestamp()
                    });
                }

                await showAlert("Updated", "Worker details have been successfully updated.");
                document.getElementById('editWorkerModal').classList.add('hidden');
                await loadWorkerData(true);
            } catch (err) {
                console.error("Update Error:", err);
                await showAlert("Error", err.message, "ph-warning-circle");
            } finally {
                const saveBtn = editWorkerForm.querySelector('button[type="submit"]');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Save Changes';
                }
            }
        });
    }

    // Attach internal functions to window for any dynamic calls if needed
    window.loadReviewData = loadReviewData;
    window.loadCustomerData = loadCustomerData;
    window.deleteContact = deleteContact;
    window.deleteBooking = deleteBooking;
    window.deleteUser = deleteUser;
    window.deleteCustomer = deleteCustomer;
    window.deleteWorker = deleteWorker;
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
    loadCustomerData();
    loadWorkerData();
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

async function loadCustomerData(forceSync = false) {
    const tbody = document.getElementById('customersTableBody');
    const emptyCustomers = document.getElementById('emptyCustomers');
    const tableContainer = document.getElementById('customersTableContainer');
    const totalStat = document.getElementById('totalCustomersStat');

    if (!tbody) return;

    if (forceSync) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;"><i class="ph ph-spinner ph-spin"></i> Loading...</td></tr>';
    }

    let firestoreCustomers = [];
    try {
        const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            firestoreCustomers.push({ ...doc.data(), firestoreId: doc.id, isFromFirestore: true });
        });
    } catch (error) {
        console.error("Firestore fetch error:", error);
    }

    let localCustomers = JSON.parse(localStorage.getItem('KAMWALLE_customers')) || [];
    
    // Merge logic
    const allCustomers = [
        ...firestoreCustomers,
        ...localCustomers.map((c, idx) => ({ ...c, localId: idx, isFromFirestore: false }))
    ];

    if (totalStat) totalStat.textContent = allCustomers.length;

    if (allCustomers.length === 0) {
        tbody.innerHTML = '';
        if (tableContainer) tableContainer.style.display = 'none';
        if (emptyCustomers) emptyCustomers.classList.remove('hidden');
        return;
    }

    if (emptyCustomers) emptyCustomers.classList.add('hidden');
    if (tableContainer) tableContainer.style.display = 'block';

    tbody.innerHTML = allCustomers.map((c, index) => {
        const dateObj = c.createdAt ? (c.createdAt.seconds ? new Date(c.createdAt.seconds * 1000) : new Date(c.createdAt)) : new Date();
        const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const idToPass = c.firestoreId || c.localId;
        const isFS = !!c.isFromFirestore;
        
        const encName = encodeURIComponent(c.name || '');
        const encPhone = encodeURIComponent(c.phone || '');
        const encAddr = encodeURIComponent(c.address || '');
        const encNote = encodeURIComponent(c.note || '');
        const encWorkerId = encodeURIComponent(c.workerId || '');

        return `
            <tr>
                <td class="td-date">${dateStr}</td>
                <td class="td-name"><strong>${c.name}</strong></td>
                <td>${c.phone}</td>
                <td style="max-width: 200px; font-size: 0.9rem;" class="truncate-text">${(c.address || '').substring(0, 30)}${c.address && c.address.length > 30 ? '...' : ''}</td>
                <td>
                    <button class="btn btn-sm btn-outline" style="margin-right: 5px;" onclick="window.viewCustomerDetails('${encName}', '${encPhone}', '${encAddr}', '${encNote}', '${idToPass}', ${isFS}, '${encWorkerId}')" type="button">
                        <i class="ph ph-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-delete" data-customer-id="${String(idToPass).replace(/"/g, '&quot;')}" data-is-firestore="${isFS}" type="button">
                        <i class="ph ph-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    document.querySelectorAll('#customersTableBody .btn-delete').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const customerId = this.getAttribute('data-customer-id');
            const isFirestore = this.getAttribute('data-is-firestore') === 'true';
            deleteCustomer(customerId, isFirestore, this);
        });
    });
}

async function deleteCustomer(id, isFirestore, btnElement) {
    if (id === undefined || id === null || id === "") return;
    const confirmed = await showConfirm("Delete Customer?", "Are you sure you want to delete this customer record?");
    if (confirmed) {
        try {
            if (btnElement) {
                btnElement.disabled = true;
                btnElement.innerHTML = '<i class="ph ph-spinner ph-spin"></i>...';
            }
            if (isFirestore) {
                await deleteDoc(doc(db, "customers", id));
            } else {
                let customers = JSON.parse(localStorage.getItem('KAMWALLE_customers')) || [];
                const idx = parseInt(id);
                if (!isNaN(idx)) {
                    customers.splice(idx, 1);
                    localStorage.setItem('KAMWALLE_customers', JSON.stringify(customers));
                }
            }
            await loadCustomerData(true);
            await showAlert("Deleted", "The customer record has been removed.");
        } catch (err) {
            console.error("Delete Error:", err);
            await showAlert("Error", err.message, "ph-warning-circle");
        }
    }
}

async function loadWorkerData(forceSync = false) {
    const tbody = document.getElementById('workersTableBody');
    const emptyWorkers = document.getElementById('emptyWorkers');
    const tableContainer = document.getElementById('workersTableContainer');
    const totalStat = document.getElementById('totalWorkersStat');

    if (!tbody) return;

    if (forceSync) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;"><i class="ph ph-spinner ph-spin"></i> Loading...</td></tr>';
    }

    let workers = [];
    try {
        const q = query(collection(db, "workers"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        window.allWorkersData = {}; // Reset
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            workers.push({ ...data, firestoreId: doc.id, isFromFirestore: true });
            window.allWorkersData[doc.id] = data;
        });
    } catch (error) {
        console.error("Firestore worker fetch error:", error);
    }

    if (totalStat) totalStat.textContent = workers.length;

    if (workers.length === 0) {
        tbody.innerHTML = '';
        if (tableContainer) tableContainer.style.display = 'none';
        if (emptyWorkers) emptyWorkers.classList.remove('hidden');
        return;
    }

    if (emptyWorkers) emptyWorkers.classList.add('hidden');
    if (tableContainer) tableContainer.style.display = 'block';

    tbody.innerHTML = workers.map((w, index) => {
        const dateObj = w.createdAt ? (w.createdAt.seconds ? new Date(w.createdAt.seconds * 1000) : new Date(w.createdAt)) : new Date();
        const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const idToPass = w.firestoreId;
        const isFS = true;
        
        const encName = encodeURIComponent(w.name || '');
        const encPhone = encodeURIComponent(w.phone || '');
        const encService = encodeURIComponent(w.service || '');
        const encExp = encodeURIComponent(w.exp || '');
        const encAddr = encodeURIComponent(w.address || '');
        const encNote = encodeURIComponent(w.note || '');

        return `
            <tr>
                <td class="td-date">${dateStr}</td>
                <td class="td-name"><strong>${w.name}</strong></td>
                <td>${w.phone}</td>
                <td><span class="service-tag" style="background: var(--primary-alpha); color: var(--primary); padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">${w.service || 'N/A'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" style="margin-right: 5px;" onclick="window.viewWorkerDetails('${encName}', '${encPhone}', '${encService}', '${encExp}', '${encAddr}', '${encNote}', '${idToPass}', ${isFS})" type="button">
                        <i class="ph ph-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-delete" data-worker-id="${String(idToPass).replace(/"/g, '&quot;')}" type="button">
                        <i class="ph ph-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    document.querySelectorAll('#workersTableBody .btn-delete').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const workerId = this.getAttribute('data-worker-id');
            deleteWorker(workerId, this);
        });
    });
}

async function deleteWorker(id, btnElement) {
    if (id === undefined || id === null || id === "") return;
    const confirmed = await showConfirm("Delete Worker?", "Are you sure you want to delete this worker record?");
    if (confirmed) {
        try {
            if (btnElement) {
                btnElement.disabled = true;
                btnElement.innerHTML = '<i class="ph ph-spinner ph-spin"></i>...';
            }
            await deleteDoc(doc(db, "workers", id));
            await loadWorkerData(true);
            await showAlert("Deleted", "The worker record has been removed.");
        } catch (err) {
            console.error("Delete Error:", err);
            await showAlert("Error", err.message, "ph-warning-circle");
        }
    }
}
