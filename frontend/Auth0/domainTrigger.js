/**
* This code is not meant to run in this project but is used on Auth0 website as a trigger inbetween signup to verify the email domain is a utah email. 
* Handler that will be called during the execution of a PreUserRegistration flow.
*
* @param {Event} event - Details about the context and user that is attempting to register.
* @param {PreUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the signup.
*/
exports.onExecutePreUserRegistration = async (event, api) => {
    // List of allowed domains (you can extend this list)
    const allowedDomains = ['utah.edu', 'umail.utah.edu'];
  
    // Extract the email address from the event object
    const email = event.user.email;
  
    if (!email) {
      throw new Error('Email address is missing.');
    }
  
    // Extract domain from email address
    const emailDomain = email.split('@')[1];
  
    // Check if the domain is allowed
    if (allowedDomains.indexOf(emailDomain) === -1) {
      // Reject the registration if the domain is not allowed
      api.access.deny('invalid_domain','Registration failed: email domain is not allowed, needs to be utah.edu or umail.utah.edu');
    } else {
      // Allow registration if the domain is allowed
      console.log(`Domain ${emailDomain} is allowed, proceeding with registration.`);
    }
  };