import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

// Example component test - replace with actual component
function ExampleButton({ onClick, children }) {
  return (
    <button 
      onClick={onClick}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      {children}
    </button>
  );
}

describe('Example Component Tests', () => {
  it('renders button with correct text', () => {
    render(<ExampleButton>Click Me</ExampleButton>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    let clicked = false;
    const handleClick = () => { clicked = true; };
    const user = userEvent.setup();
    
    render(<ExampleButton onClick={handleClick}>Click</ExampleButton>);
    await user.click(screen.getByRole('button'));
    
    expect(clicked).toBe(true);
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(<ExampleButton>Accessible</ExampleButton>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// Example utility function test
describe('Validation Helpers', () => {
  it('validates email format', () => {
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('validates price format', () => {
    const isValidPrice = (price) => {
      const num = parseFloat(price);
      return !isNaN(num) && num > 0;
    };
    
    expect(isValidPrice('9.99')).toBe(true);
    expect(isValidPrice('0')).toBe(false);
    expect(isValidPrice('-5')).toBe(false);
    expect(isValidPrice('abc')).toBe(false);
  });
});
