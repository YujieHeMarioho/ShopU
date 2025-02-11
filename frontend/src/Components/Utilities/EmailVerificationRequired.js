import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import styles from './EmailVerificationRequired.module.css';

const EmailVerificationRequired = () => {
  const { logout } = useAuth0();
  const navigate = useNavigate();


  const handleResendVerification = () => {
    // Implement logic to resend verification email if needed probably would involve calling an Auth0 API endpoint or method
  };

  const handleReturnToApp = () => {
    // Redirect to the profile page for the user to finish setting up their profile
    navigate('/profile');
  };
  
return (
  <div className={styles.emailVerificationContainer}>
    <div className={styles.emailVerificationCard}>
      <h1 className={styles.title}>Email Verification Required</h1>
      <p className={styles.description}>Please verify your email address to continue using our services.</p>
      <p className={styles.instructions}>We've sent a verification email to your registered email address. Please check your inbox and follow the instructions to verify your account.</p>
      <button className={styles.returnButton} onClick={handleReturnToApp}>
        Return to Application
      </button>
      <p className={styles.smallText}>
        Didn't receive the email? Check your spam folder or try logging in with a different email.
      </p>
      <button className={styles.logoutButton} onClick={() => logout({ returnTo: window.location.origin })}>
        Log Out
      </button>
    </div>
  </div>
);
};

export default EmailVerificationRequired;