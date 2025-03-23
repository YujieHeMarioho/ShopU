import React, { useState } from "react";
import { Card, Table } from "react-bootstrap";

const OrderHistoryPaymentInfo = () => {
  // Sample order data with payment method
  const orders = [
    { orderId: 1, product: "Laptop", amount: 500, status: "Completed", paymentMethod: "Credit Card" },
    { orderId: 2, product: "Phone", amount: 200, status: "Pending", paymentMethod: "PayPal" },
    { orderId: 3, product: "Headphones", amount: 150, status: "Completed", paymentMethod: "Venmo" },
    { orderId: 4, product: "Monitor", amount: 300, status: "Completed", paymentMethod: "Stripe" },
    { orderId: 5, product: "Keyboard", amount: 50, status: "Pending", paymentMethod: "Cash" },
  ];

  // Calculate total revenue by summing up completed order amounts
  const totalRevenue = orders
    .filter(order => order.status === "Completed")
    .reduce((total, order) => total + order.amount, 0);

  return (
    <div>
      {/* Total Revenue Section */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Total Revenue</Card.Title>
          <h2>${totalRevenue.toFixed(2)}</h2>
        </Card.Body>
      </Card>

      {/* Order History Section */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Order History</Card.Title>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Method</th> {/* New column for payment method */}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId}>
                  <td>{order.orderId}</td>
                  <td>{order.product}</td>
                  <td>${order.amount}</td> {/* Display amount */}
                  <td>{order.status}</td>
                  <td>{order.paymentMethod}</td> {/* Display payment method */}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default OrderHistoryPaymentInfo;
