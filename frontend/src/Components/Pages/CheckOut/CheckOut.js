import React, { useState } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import styles from "./CheckOut.module.css";

const CheckOut = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Product 1",
      description: "This is a great product.",
      price: 10.0,
      quantity: 1,
      image: "https://via.placeholder.com/100",
    },
    {
      id: 2,
      name: "Product 2",
      description: "This product is amazing.",
      price: 20.0,
      quantity: 1,
      image: "https://via.placeholder.com/100",
    },
    {
      id: 3,
      name: "Product 3",
      description: "You will love this product.",
      price: 15.0,
      quantity: 2,
      image: "https://via.placeholder.com/100",
    },
  ]);

  const [paid, setPaid] = useState(false);
  const [error, setError] = useState(null);

  const totalAmount = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

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

  const updateQuantity = (id, increment) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(1, item.quantity + increment),
            }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  return (
    <div className={styles.bg}>
      <div className={styles.checkoutContainer}>
        <h1>Checkout</h1>

        {paid ? (
          <div>
            <h2>Payment Successful!</h2>
            <p>Thank you for your purchase.</p>
          </div>
        ) : (
          <div className={styles.checkoutGrid}>
            {/* Left Section: Cart Items */}
            <div className={styles.cartItems}>
              {cartItems.map((item) => (
                <div className={styles.cartItem} key={item.id}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className={styles.cartItemImage}
                  />
                  <div className={styles.cartItemInfo}>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <p>Price: ${item.price.toFixed(2)}</p>
                    <div className={styles.cartItemControls}>
                      <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Section: Summary and Payment */}
            <div className={styles.cartSummary}>
              <h2>Order Summary</h2>
              <p>
                Total Items:{" "}
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
              <p>Total Price: ${totalAmount.toFixed(2)}</p>
              <PayPalButtons
                style={{ layout: "vertical" }}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    purchase_units: [
                      {
                        amount: {
                          value: totalAmount.toFixed(2),
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
          </div>
        )}

        {error && <p className={styles.errorMessage}>Error: {error.message}</p>}
      </div>
    </div>
  );
};

export default CheckOut;
