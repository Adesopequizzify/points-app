import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Table } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminDashboard() {
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const { currentUser } = useAuth();
  const history = useHistory();

  useEffect(() => {
    if (currentUser && !currentUser.isAdmin) {
      history.push('/');
    }
  }, [currentUser, history]);

  useEffect(() => {
    async function fetchUsers() {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    }

    fetchUsers();
  }, []);

  async function handleResetStreak(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        checkInStreak: 0,
        lastCheckIn: null
      });
      setUsers(users.map(user =>
        user.id === userId ? { ...user, checkInStreak: 0, lastCheckIn: null } : user
      ));
    } catch (error) {
      setError('Failed to reset user streak');
    }
  }

  return (
    <div className="container mt-5">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Admin Dashboard</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Email</th>
                <th>Balance</th>
                <th>Check-in Streak</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.balance}</td>
                  <td>{user.checkInStreak}</td>
                  <td>
                    <Button variant="warning" onClick={() => handleResetStreak(user.id)}>
                      Reset Streak
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}