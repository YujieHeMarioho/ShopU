import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import './EmailVerificationRequired.css'; 

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
    <div className="email-verification-container">
      <div className="email-verification-card">
        <h1>Email Verification Required</h1>
        <p>Please verify your email address to continue using our services.</p>
        <p>We've sent a verification email to your registered email address. Please check your inbox and follow the instructions to verify your account.</p>
        {/* Not sure if we need this but will leave it commented out incase we decide to implement
         <button className="resend-button" onClick={handleResendVerification}>
          Resend Verification Email
        </button> */}
        <button className="return-button" onClick={handleReturnToApp}>
          Return to Application
        </button>
        <p className="small-text">
          Didn't receive the email? Check your spam folder or try logging in with a different email.
        </p>
        <button className="logout-button" onClick={() => logout({ returnTo: window.location.origin })}>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationRequired;