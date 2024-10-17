import React, { useState, useEffect } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function Dashboard() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { currentUser, setCurrentUser } = useAuth();
  const history = useHistory();

  useEffect(() => {
    if (currentUser && !currentUser.emailVerified) {
      setError('Please verify your email address');
    }
  }, [currentUser]);

  async function handleLogout() {
    setError('');

    try {
      await signOut(auth);
      history.push('/login');
    } catch {
      setError('Failed to log out');
    }
  }

  async function handleClaim() {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    const now = new Date();
    const lastClaim = userData.lastClaim ? userData.lastClaim.toDate() : new Date(0);
    const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);

    if (hoursSinceLastClaim >= 4) {
      const newBalance = userData.balance + 100;
      await updateDoc(userRef, {
        balance: newBalance,
        lastClaim: now
      });
      setCurrentUser({ ...currentUser, balance: newBalance });
      setMessage('Successfully claimed 100 points!');
    } else {
      setError('You can only claim points every 4 hours');
    }
  }

  async function handleDailyCheckIn() {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    const now = new Date();
    const lastCheckIn = userData.lastCheckIn ? userData.lastCheckIn.toDate() : new Date(0);
    const daysSinceLastCheckIn = (now - lastCheckIn) / (1000 * 60 * 60 * 24);

    if (daysSinceLastCheckIn >= 1) {
      const newStreak = (daysSinceLastCheckIn < 2) ? userData.checkInStreak + 1 : 1;
      const reward = Math.min(newStreak * 10, 100);
      const newBalance = userData.balance + reward;

      await updateDoc(userRef, {
        balance: newBalance,
        checkInStreak: newStreak,
        lastCheckIn: now
      });

      setCurrentUser({ ...currentUser, balance: newBalance, checkInStreak: newStreak });
      setMessage(`Daily check-in successful! You earned ${reward} points. Current streak: ${newStreak} days`);
    } else {
      setError('You have already checked in today');
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">Profile</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            {message && <Alert variant="success">{message}</Alert>}
            <strong>Email:</strong> {currentUser.email}
            <strong>Balance:</strong> {currentUser.balance} points
            <strong>Check-in Streak:</strong> {currentUser.checkInStreak} days
            <Button onClick={handleClaim} className="w-100 mt-3">
              Claim Points
            </Button>
            <Button onClick={handleDailyCheckIn} className="w-100 mt-3">
              Daily Check-in
            </Button>
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
          <Button variant="link" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}