// Firebase configuration
const firebaseConfig = {
   apiKey: "AIzaSyBIXEa1506o1ggIs7rNz5ZaTb7P0ZQWSWw",
   authDomain: "points-io.firebaseapp.com",
   projectId: "points-io",
   storageBucket: "points-io.appspot.com",
   messagingSenderId: "639700741828",
   appId: "1:639700741828:web:0202e8f2c130c5a6bda391",
   measurementId: "G-9T3C2JMD7L"
 };
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to auth and firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Check if user is logged in
auth.onAuthStateChanged((user) => {
  if (user) {
    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
      window.location.href = 'dashboard.html';
    } else if (window.location.pathname.includes('dashboard.html')) {
      loadUserData(user);
    } else if (window.location.pathname.includes('admin.html')) {
      checkAdminStatus(user);
    }
  } else {
    if (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('admin.html')) {
      window.location.href = 'login.html';
    }
  }
});

// Login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = 'dashboard.html';
      })
      .catch((error) => {
        alert(error.message);
      });
  });
}

// Google Sign-In
const googleSignIn = document.getElementById('googleSignIn');
if (googleSignIn) {
  googleSignIn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(() => {
        window.location.href = 'dashboard.html';
      })
      .catch((error) => {
        alert(error.message);
      });
  });
}

// Signup form
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        return db.collection('users').doc(userCredential.user.uid).set({
          email: email,
          balance: 0,
          lastClaim: null,
          checkInStreak: 0,
          lastCheckIn: null,
          isAdmin: false
        });
      })
      .then(() => {
        window.location.href = 'dashboard.html';
      })
      .catch((error) => {
        alert(error.message);
      });
  });
}

// Load user data on dashboard
function loadUserData(user) {
  const userEmail = document.getElementById('userEmail');
  const userBalance = document.getElementById('userBalance');
  const checkInStreak = document.getElementById('checkInStreak');

  db.collection('users').doc(user.uid).get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        userEmail.textContent = data.email;
        userBalance.textContent = data.balance;
        checkInStreak.textContent = data.checkInStreak;
      }
    })
    .catch((error) => {
      console.error("Error getting user data:", error);
    });
}

// Claim points
const claimPoints = document.getElementById('claimPoints');
if (claimPoints) {
  claimPoints.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
      const userRef = db.collection('users').doc(user.uid);
      db.runTransaction((transaction) => {
        return transaction.get(userRef).then((doc) => {
          if (!doc.exists) {
            throw "Document does not exist!";
          }
          const data = doc.data();
          const now = new Date();
          const lastClaim = data.lastClaim ? data.lastClaim.toDate() : new Date(0);
          const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);

          if (hoursSinceLastClaim >= 4) {
            const newBalance = data.balance + 100;
            transaction.update(userRef, { balance: newBalance, lastClaim: now });
            return newBalance;
          } else {

            throw "You can only claim points every 4 hours";
          }
        });
      }).then((newBalance) => {
        alert("Successfully claimed 100 points!");
        document.getElementById('userBalance').textContent = newBalance;
      }).catch((error) => {
        alert(error);
      });
    }
  });
}

// Daily check-in
const dailyCheckIn = document.getElementById('dailyCheckIn');
if (dailyCheckIn) {
  dailyCheckIn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
      const userRef = db.collection('users').doc(user.uid);
      db.runTransaction((transaction) => {
        return transaction.get(userRef).then((doc) => {
          if (!doc.exists) {
            throw "Document does not exist!";
          }
          const data = doc.data();
          const now = new Date();
          const lastCheckIn = data.lastCheckIn ? data.lastCheckIn.toDate() : new Date(0);
          const daysSinceLastCheckIn = (now - lastCheckIn) / (1000 * 60 * 60 * 24);

          if (daysSinceLastCheckIn >= 1) {
            const newStreak = (daysSinceLastCheckIn < 2) ? data.checkInStreak + 1 : 1;
            const reward = Math.min(newStreak * 10, 100);
            const newBalance = data.balance + reward;
            transaction.update(userRef, {
              balance: newBalance,
              checkInStreak: newStreak,
              lastCheckIn: now
            });
            return { newBalance, newStreak, reward };
          } else {
            throw "You have already checked in today";
          }
        });
      }).then((result) => {
        alert(`Daily check-in successful! You earned ${result.reward} points. Current streak: ${result.newStreak} days`);
        document.getElementById('userBalance').textContent = result.newBalance;
        document.getElementById('checkInStreak').textContent = result.newStreak;
      }).catch((error) => {
        alert(error);
      });
    }
  });
}

// Logout
const logout = document.getElementById('logout');
if (logout) {
  logout.addEventListener('click', () => {
    auth.signOut().then(() => {
      window.location.href = 'login.html';
    }).catch((error) => {
      console.error("Error signing out: ", error);
    });
  });
}

// Check admin status and load admin dashboard
function checkAdminStatus(user) {
  db.collection('users').doc(user.uid).get()
    .then((doc) => {
      if (doc.exists && doc.data().isAdmin) {
        loadAdminDashboard();
      } else {
        alert("You don't have permission to access this page");
        window.location.href = 'dashboard.html';
      }
    })
    .catch((error) => {
      console.error("Error checking admin status:", error);
    });
}

// Load admin dashboard
function loadAdminDashboard() {
  const userTableBody = document.getElementById('userTableBody');
  db.collection('users').get()
    .then((querySnapshot) => {
      userTableBody.innerHTML = '';
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const row = `
          <tr>
            <td>${data.email}</td>
            <td>${data.balance}</td>
            <td>${data.checkInStreak}</td>
            <td><button class="btn btn-warning btn-sm" onclick="resetStreak('${doc.id}')">Reset Streak</button></td>
          </tr>
        `;
        userTableBody.innerHTML += row;
      });
    })
    .catch((error) => {
      console.error("Error getting users:", error);
    });
}

// Reset user streak
function resetStreak(userId) {
  db.collection('users').doc(userId).update({
      checkInStreak: 0,
      lastCheckIn: null
    })
    .then(() => {
      alert("User streak reset successfully");
      loadAdminDashboard();
    })
    .catch((error) => {
      console.error("Error resetting streak:", error);
    });
}