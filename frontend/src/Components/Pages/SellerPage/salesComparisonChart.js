import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Form } from "react-bootstrap";

const comparisonData = [
  { date: "2025-02-01", productA: 5, productB: 3, productC: 2 },
  { date: "2025-02-02", productA: 8, productB: 4, productC: 6 },
  { date: "2025-02-03", productA: 4, productB: 7, productC: 5 },
  { date: "2025-02-04", productA: 6, productB: 2, productC: 3 },
  { date: "2025-02-05", productA: 7, productB: 5, productC: 8 },
  { date: "2025-02-06", productA: 10, productB: 9, productC: 6 },
  { date: "2025-02-07", productA: 3, productB: 4, productC: 2 },
];

const SalesComparisonChart = () => {
  // State to manage which products are selected
  const [selectedProducts, setSelectedProducts] = useState({
    productA: true,
    productB: true,
    productC: true,
  });

  // Handle product selection change
  const handleProductSelection = (event) => {
    const { name, checked } = event.target;
    setSelectedProducts((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  return (
    <div>
      {/* Filter selection for products */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Select Products to Display</h3>
        <Form.Check
          type="checkbox"
          label="Product A"
          name="productA"
          checked={selectedProducts.productA}
          onChange={handleProductSelection}
        />
        <Form.Check
          type="checkbox"
          label="Product B"
          name="productB"
          checked={selectedProducts.productB}
          onChange={handleProductSelection}
        />
        <Form.Check
          type="checkbox"
          label="Product C"
          name="productC"
          checked={selectedProducts.productC}
          onChange={handleProductSelection}
        />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={comparisonData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {selectedProducts.productA && (
            <Line type="monotone" dataKey="productA" stroke="#8884d8" />
          )}
          {selectedProducts.productB && (
            <Line type="monotone" dataKey="productB" stroke="#82ca9d" />
          )}
          {selectedProducts.productC && (
            <Line type="monotone" dataKey="productC" stroke="#ff7300" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesComparisonChart;
