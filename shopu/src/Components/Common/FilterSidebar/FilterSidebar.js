import React, { useState } from 'react';
import { Button, Form, ButtonGroup, ToggleButton } from 'react-bootstrap';
import styles from './FilterSidebar.module.css';

const FilterSidebar = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedType, setSelectedType] = useState(''); // Initially no selection
  const [userRating, setUserRating] = useState(0);

  const categories = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Toys'];

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
    setUserRating(e.target.value);
  };

  const handleApplyFilters = () => {
    // Apply filter logic here
    console.log('Filters applied:', { selectedCategories, selectedType, userRating });
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
          <ToggleButton
            type="radio"
            variant="outline-primary"
            value="item"
            checked={selectedType === 'item'}
            onChange={() => handleTypeChange('item')}
          >
            Item
          </ToggleButton>
          <ToggleButton
            type="radio"
            variant="outline-primary"
            value="service"
            checked={selectedType === 'service'}
            onChange={() => handleTypeChange('service')}
          >
            Service
          </ToggleButton>
          <ToggleButton
            type="radio"
            variant="outline-primary"
            value="both"
            checked={selectedType === 'both'}
            onChange={() => handleTypeChange('both')}
          >
            Both
          </ToggleButton>
        </ButtonGroup>
      </Form.Group>

      {/* User Rating Filter */}
      <div className={styles.sliderContainer}>
        <Form.Label>User Rating</Form.Label>
        <input
          type="range"
          min="1"
          max="5"
          value={userRating}
          className={styles.slider}
          onChange={handleRatingChange}
        />
        <div className={styles.ratingText}>Rating: {userRating}</div>
      </div>

      {/* Apply Button */}
      <Button className={styles.applyButton} onClick={handleApplyFilters}>
        Apply Filters
      </Button>
    </div>
  );
};

export default FilterSidebar;
