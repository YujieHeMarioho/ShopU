import React, { useState } from 'react';
import { Button, Form, ButtonGroup } from 'react-bootstrap';
import styles from './FilterSidebar.module.css';

const FilterSidebar = ({ onFilterChange }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedType, setSelectedType] = useState(''); // Initially no selection
  const [selectedRatings, setSelectedRatings] = useState([]); // Multiple ratings selection

  const categories = ['Electronics', 'Furniture', 'Clothing', 'Accessories', 'Books', 'Sports', 'Toys', 'Free Stuff', 'Tickets'];
  const ratings = ['3 stars+', '4 stars+', '5 stars'];

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(item => item !== category) : [...prev, category]
    );
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
  };

  const handleRatingChange = (e) => {
    const rating = e.target.value;
    setSelectedRatings(prev =>
      prev.includes(rating) ? prev.filter(item => item !== rating) : [...prev, rating]
    );
  };

  // Call the parent component's filter change handler with the current filters
  const handleApplyFilters = () => {
    const filters = {
      categories: selectedCategories,
      type: selectedType,
      ratings: selectedRatings,
    };
    onFilterChange(filters);
  };

  return (
    <div className={styles.filterSidebar}>
      <div className={styles.title}>Filters</div>

      {/* Categories Filter */}
      <Form.Group className="checkbox-group">
        <Form.Label>Categories</Form.Label>
        {categories.map((category, index) => (
          <Form.Check
            key={index}
            type="checkbox"
            label={category}
            value={category}
            checked={selectedCategories.includes(category)}
            onChange={handleCategoryChange}
          />
        ))}
      </Form.Group>

      {/* Type Filter (Toggle Buttons) */}
      <Form.Group>
        <Form.Label>Type</Form.Label>
        <ButtonGroup>
          <Button
            variant="outline-primary"
            active={selectedType === 'item'}
            onClick={() => handleTypeChange('item')}
          >
            Item
          </Button>
          <Button
            variant="outline-primary"
            active={selectedType === 'service'}
            onClick={() => handleTypeChange('service')}
          >
            Service
          </Button>
          <Button
            variant="outline-primary"
            active={selectedType === 'both'}
            onClick={() => handleTypeChange('both')}
          >
            Both
          </Button>
        </ButtonGroup>
      </Form.Group>

      {/* User Rating Filter (Multiple Checkboxes) */}
      <Form.Group className="checkbox-group">
        <Form.Label>User Rating</Form.Label>
        {ratings.map((rating, index) => (
          <Form.Check
            key={index}
            type="checkbox"
            label={rating}
            value={rating}
            checked={selectedRatings.includes(rating)}
            onChange={handleRatingChange}
          />
        ))}
      </Form.Group>

      {/* Apply Button */}
      <Button className={styles.applyButton} onClick={handleApplyFilters}>
        Apply Filters
      </Button>
    </div>
  );
};

export default FilterSidebar;
