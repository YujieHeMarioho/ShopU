import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import styles from './UserPreferences.module.css';

const UserPreferences = () => {
  const { getAccessTokenSilently } = useAuth0();

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'English',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    activityAlerts: true,
    profileVisibility: 'Public',
    messagePrivacy: 'Everyone',
    twoFactorAuth: false,
    postCustomization: 'Trending',
    preferredCategories: [],
  });

  const [message, setMessage] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSavePreferences = async () => {
    try {
      const token = await getAccessTokenSilently();

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save preferences');

      setMessage('Preferences updated successfully!');
    } catch (error) {
      setMessage('Error saving preferences: ' + error.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>User Preferences</div>

      {/* Theme Toggle */}
      <div className={styles.section}>
        <label className={styles.label}>Theme</label>
        <div className={styles.themeToggle}>
          <span>Light</span>
          <label className={styles.toggleContainer}>
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={handleThemeToggle}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSlider}></span>
          </label>
          <span>Dark</span>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Time Zone</label>
        <input type="text" name="timezone" value={preferences.timezone} onChange={handleChange} className={styles.input} />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Date Format</label>
        <select name="dateFormat" value={preferences.dateFormat} onChange={handleChange} className={styles.select}>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
        </select>
      </div>

      <div className={styles.section}>
        <h5>Notifications</h5>
        <label className={styles.checkbox}>
          <input type="checkbox" name="emailNotifications" checked={preferences.emailNotifications} onChange={handleChange} /> Email Notifications
        </label>
        <label className={styles.checkbox}>
          <input type="checkbox" name="pushNotifications" checked={preferences.pushNotifications} onChange={handleChange} /> Push Notifications
        </label>
        <label className={styles.checkbox}>
          <input type="checkbox" name="marketingEmails" checked={preferences.marketingEmails} onChange={handleChange} /> Marketing Emails
        </label>
        <label className={styles.checkbox}>
          <input type="checkbox" name="activityAlerts" checked={preferences.activityAlerts} onChange={handleChange} /> Activity Alerts
        </label>
      </div>

      <div className={styles.section}>
        <h5>Privacy</h5>
        <label className={styles.label}>Profile Visibility</label>
        <select name="profileVisibility" value={preferences.profileVisibility} onChange={handleChange} className={styles.select}>
          <option value="Public">Public</option>
          <option value="Friends Only">Friends Only</option>
          <option value="Private">Private</option>
        </select>

        <label className={styles.label}>Who Can Message You?</label>
        <select name="messagePrivacy" value={preferences.messagePrivacy} onChange={handleChange} className={styles.select}>
          <option value="Everyone">Everyone</option>
          <option value="Friends">Friends</option>
          <option value="No One">No One</option>
        </select>

        <label className={styles.checkbox}>
          <input type="checkbox" name="twoFactorAuth" checked={preferences.twoFactorAuth} onChange={handleChange} /> Enable Two-Factor Authentication
        </label>
      </div>

      <div className={styles.section}>
        <h5>Content Preferences</h5>
        <label className={styles.label}>Post/Feed Customization</label>
        <select name="postCustomization" value={preferences.postCustomization} onChange={handleChange} className={styles.select}>
          <option value="Trending">Trending</option>
          <option value="Recent">Recent</option>
          <option value="Personalized">Personalized</option>
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Preferred Categories</label>
        <input
          type="text"
          placeholder="Enter categories separated by commas"
          name="preferredCategories"
          value={preferences.preferredCategories.join(', ')}
          onChange={(e) => setPreferences({ ...preferences, preferredCategories: e.target.value.split(', ') })}
          className={styles.input}
        />
      </div>

      <div className={styles.buttonGroup}>
        <button className={`${styles.primaryButton} ${styles.warningButton}`}>Download My Data</button>
        <button className={`${styles.primaryButton} ${styles.dangerButton}`}>Deactivate/Delete Account</button>
      </div>

      <button className={styles.primaryButton} onClick={handleSavePreferences}>Save Preferences</button>

      {message && <p className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>{message}</p>}
    </div>
  );
};

export default UserPreferences;
