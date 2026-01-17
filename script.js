import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- STEP 1: Firebase Configuration ---

const firebaseConfig = {
    apiKey: "AIzaSyBfZQ4Ha3eUyXKtIDBuV6QMKKjkaujZDOw",
    authDomain: "loyalty-logger-test.firebaseapp.com",
    projectId: "loyalty-logger-test",
    storageBucket: "loyalty-logger-test.firebasestorage.app",
    messagingSenderId: "111324700184",
    appId: "1:111324700184:web:5fe6135a4403b5ec902d6d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- State Management ---
let currentUser = null;
let userData = null;

const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const loyaltyGrid = document.getElementById('loyalty-grid');
const checkInBtn = document.getElementById('check-in-btn');
const bonusInfo = document.getElementById('bonus-info');

// Generate 10 stamps in the grid
function setupGrid() {
    loyaltyGrid.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const stamp = document.createElement('div');
        stamp.className = 'stamp';
        stamp.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
        loyaltyGrid.appendChild(stamp);
    }
}

// Update UI based on data
async function updateUI(data) {
    if (!data) return;

    // Update Bonus Counter
    bonusInfo.textContent = `Total Free Drinks Earned: ${data.total_bonuses || 0}`;

    // Update Stamps
    const stamps = document.querySelectorAll('.stamp');
    stamps.forEach((s, index) => {
        if (index < data.visits) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });

    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    if (data.last_check_in === today) {
        setButtonDisabled();
    } else {
        setButtonEnabled();
    }
}

function setButtonDisabled() {
    checkInBtn.textContent = 'Come back tomorrow';
    checkInBtn.classList.remove('btn-active');
    checkInBtn.classList.add('btn-disabled');
}

function setButtonEnabled() {
    checkInBtn.textContent = 'Log Visit';
    checkInBtn.classList.add('btn-active');
    checkInBtn.classList.remove('btn-disabled');
}

// --- STEP 3: Logic - The "Check-in" Function ---
async function claimStamp() {
    if (!currentUser || !userData) return;

    const today = new Date().toISOString().split('T')[0];

    // 1. Prevent double-dipping
    if (userData.last_check_in === today) {
        console.log("Already checked in today.");
        return;
    }

    // 2. Increment Logic
    let temp_visits = (userData.visits || 0) + 1;
    let new_visits = userData.visits || 0;
    let new_bonuses = userData.total_bonuses || 0;

    if (temp_visits >= 10) {
        // Bonus Unlocked
        new_visits = 0;
        new_bonuses += 1;
    } else {
        // Stamp Added
        new_visits = temp_visits;
    }

    // 3. Update Firestore
    const userRef = doc(db, "users", currentUser.uid);
    const updatedData = {
        visits: new_visits,
        total_bonuses: new_bonuses,
        last_check_in: today
    };

    try {
        await updateDoc(userRef, updatedData);
        userData = updatedData; // Update local state

        // 4. Trigger UI Animation & Refresh
        animateCheckIn();
        setTimeout(() => updateUI(userData), 500);
    } catch (e) {
        console.error("Error updating document: ", e);
    }
}

function animateCheckIn() {
    checkInBtn.textContent = 'Visit Logged!';
    checkInBtn.classList.remove('btn-active');
    checkInBtn.classList.add('btn-disabled');
}

// --- Authentication Listeners ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        authSection.classList.add('hidden');
        dashboard.classList.remove('hidden');
        dashboard.style.display = 'flex';

        setupGrid();

        // Fetch user data
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            userData = docSnap.data();
        } else {
            // New user initialization
            userData = {
                visits: 0,
                total_bonuses: 0,
                last_check_in: ""
            };
            await setDoc(userRef, userData);
        }
        updateUI(userData);
    } else {
        currentUser = null;
        userData = null;
        authSection.classList.remove('hidden');
        dashboard.classList.add('hidden');
        dashboard.style.display = 'none';
    }
});

// Event Listeners
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('auth-error');

    try {
        await signInWithEmailAndPassword(auth, email, password);
        errorEl.style.display = 'none';
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.style.display = 'block';
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth);
});

checkInBtn.addEventListener('click', claimStamp);
