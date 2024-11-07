// frontend/src/Components/Pages/Profile/Profile.js

import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import styles from './Profile.module.css'; // Create corresponding CSS module

const Profile = () => {
    const { user, isAuthenticated, isLoading } = useAuth0();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        isAuthenticated && (
            <div className={styles.profileContainer}>
                <h1>My Profile</h1>
                <img src={user.picture} alt={user.name} className={styles.profileImage} />
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                {/* Add more user-specific information as needed */}
            </div>
        )
    );
};

export default Profile;
