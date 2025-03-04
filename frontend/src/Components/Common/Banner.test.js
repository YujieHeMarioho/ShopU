// frontend/src/Components/Common/Banner.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Banner } from './Banner';

describe('Banner Component', () => {
  test('renders with default props', () => {
    render(<Banner />);
    
    const titleElement = screen.getByText('Welcome to ShopU!');
    expect(titleElement).toBeInTheDocument();
    
    const descriptionElement = screen.getByText(/Lorem Ipsum is simply dummy text/i);
    expect(descriptionElement).toBeInTheDocument();
  });

  test('renders with custom props', () => {
    const customTitle = 'Custom Title';
    const customDescription = 'Custom Description';
    
    render(<Banner title={customTitle} description={customDescription} />);
    
    const titleElement = screen.getByText(customTitle);
    expect(titleElement).toBeInTheDocument();
    
    const descriptionElement = screen.getByText(customDescription);
    expect(descriptionElement).toBeInTheDocument();
  });
});