import React, { useState } from 'react';
import { PayPalButtons } from "@paypal/react-paypal-js";
import './CheckOut.css'; // Optional for styling

const CheckOut = () => {
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState(null);

  const handlePaymentSuccess = (details) => {
    setPaid(true);
    console.log("Transaction completed by " + details.payer.name.given_name);
    alert(`Payment successful! Transaction ID: ${details.id}`);
  };

  const handlePaymentError = (err) => {
    setError(err);
    console.error("PayPal Error:", err);
    alert("An error occurred during the transaction.");
  };

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>

      {paid ? (
        <div>
          <h2>Payment Successful!</h2>
          <p>Thank you for your purchase.</p>
        </div>
      ) : (
        <div>
          <h2>Your Total: $20.00</h2> {/* Replace with dynamic total if needed */}
          <PayPalButtons
            style={{ layout: "vertical" }}
            createOrder={(data, actions) => {
              return actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      value: "20.00", // Hardcoded test value
                    },
                  },
                ],
              });
            }}
            onApprove={(data, actions) => {
              return actions.order.capture().then(handlePaymentSuccess);
            }}
            onError={handlePaymentError}
          />
        </div>
      )}

      {error && <p className="error-message">Error: {error.message}</p>}
    </div>
  );
};

export default CheckOut;
