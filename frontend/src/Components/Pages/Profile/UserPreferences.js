import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import styles from './UserPreferences.module.css';

const UserPreferences = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Load theme from localStorage or default to 'light'
  const [themeMode, setThemeMode] = useState(localStorage.getItem("theme") || "light");
  const [settingsThemeMode, setSettingsThemeMode] = useState("light");

  const [preferences, setPreferences] = useState({
    theme: themeMode,
    language: 'English',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    email_notifications: true,
    push_notifications: true,
    marketingEmails: false,
    activityAlerts: true,
    privacy_level: 'Public',
    messagePrivacy: 'Everyone',
    twoFactorAuth: false,
    postCustomization: 'Trending',
    user_interests: [],
    follow_privacy: 'public'
  });

  // Function to detect system theme
  const detectSystemTheme = () => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  // Apply the theme only when the "Save Preferences" button is clicked
  useEffect(() => {
    if (themeMode === "system") {
      const systemTheme = detectSystemTheme();
      document.documentElement.setAttribute("data-theme", systemTheme);
    } else {
      document.documentElement.setAttribute("data-theme", themeMode);
    }
  }, [themeMode]); // Apply theme when themeMode is updated

  // Fetch user preferences from the backend on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/userPreferences/settings`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load preferences');
        }

        const data = await response.json();
        setPreferences(data);
        setSettingsThemeMode(data.theme || "light");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user preferences:", error);
        setError("Failed to load preferences.");
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [getAccessTokenSilently]);

  // Handle theme selection
  const handleThemeToggle = (e) => {
    const newTheme = e.target.value;
    setSettingsThemeMode(newTheme);
    setPreferences((prev) => ({
      ...prev,
      theme: newTheme
    }));
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle saving preferences
  const handleSavePreferences = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/userPreferences/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences) // Send preferences as JSON
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      // Update the theme after saving preferences
      setThemeMode(preferences.theme); // Apply the theme from preferences
      setSettingsThemeMode(preferences.theme);
      localStorage.setItem('theme', preferences.theme); // Store in localStorage
      setMessage('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save preferences.');
    }
  };

  if (loading) return <p>Loading user preferences...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>User Preferences</div>

      {/* Theme Selection */}
      <div className={styles.section}>
        <label className={styles.label}>Theme</label>
        <div className={styles.themeToggle}>
          {["light", "dark", "system"].map((theme) => (
            <div key={theme} className={styles.radioOption}>
              <input
                type="radio"
                id={theme}
                name="theme"
                value={theme}
                checked={settingsThemeMode === theme}
                onChange={handleThemeToggle}
                className={styles.radioInput}
              />
              <label htmlFor={theme} className={styles.radioLabel}>
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Time Zone */}
      <div className={styles.section}>
        <label className={styles.label}>Time Zone</label>
        <input type="text" name="timezone" value={preferences.timezone} onChange={handleChange} className={styles.input} />
      </div>

      {/* Notifications */}
      <div className={styles.section}>
        <h5>Notifications</h5>
        {["email_notifications", "push_notifications", "marketingEmails", "activityAlerts"].map((notif) => (
          <label key={notif} className={styles.checkbox}>
            <input
              type="checkbox"
              name={notif}
              checked={preferences[notif]}
              onChange={handleChange}
            />
            {notif.replace(/_/g, " ")}
          </label>
        ))}
      </div>

      {/* Privacy */}
      <div className={styles.section}>
        <h5>Privacy</h5>
        <label className={styles.label}>Profile Visibility</label>
        <select name="privacy_level" value={preferences.privacy_level} onChange={handleChange} className={styles.select}>
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

        <label className={styles.label}>Who Can Follow You?</label>
        <select name="follow_privacy" value={preferences.follow_privacy} onChange={handleChange} className={styles.select}>
          <option value="public">Anyone</option>
          <option value="private">Request Only</option>
        </select>
      </div>

      {/* Preferred Categories */}
      <div className={styles.section}>
        <label className={styles.label}>Preferred Categories</label>
        <input
          type="text"
          placeholder="Enter categories separated by commas"
          name="user_interests"
          value={preferences.user_interests.join(', ')}
          onChange={(e) => setPreferences({ ...preferences, user_interests: e.target.value.split(', ') })}
          className={styles.input}
        />
      </div>

      {/* Save Button */}
      <button className={styles.primaryButton} onClick={handleSavePreferences}>
        Save Preferences
      </button>

      {/* Message Display */}
      {message && <p className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>{message}</p>}
    </div>
  );
};

export default UserPreferences;
