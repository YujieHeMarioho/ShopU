import React, { useState, useEffect } from 'react';
import { Button, Form, ButtonGroup } from 'react-bootstrap';
import styles from './FilterSidebar.module.css';
import { useAuth0 } from '@auth0/auth0-react';

const FilterSidebar = ({ onFilterChange }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedType, setSelectedType] = useState(''); // Initially no selection
  const [selectedRatings, setSelectedRatings] = useState([]); // Multiple ratings selection
  const [categories, setCategories] = useState([]); // State to store categories fetched from the API
  const { getAccessTokenSilently } = useAuth0();  

  // Fetch the most recent listings from the server
  const fetchFilters = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('http://localhost:8080/api/filters',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      const rawData = await response.json();
      
      // set all the filters with what gets returned
      setCategories(rawData.categories || []);
      //ratings = rawData('ratings');
      //types = rawData('types');

    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const ratings = ['3 stars+', '4 stars+', '5 stars'];


  // Call fetchFilters when the component is mounted
  useEffect(() => {
    fetchFilters();
  }, []); // Empty dependency array ensures this runs only once when the component mounts


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
