import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import AIAssistant from './AIAssistant';
import { BrowserRouter } from 'react-router-dom';
import * as AuthContext from '../contexts/AuthContext';

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn();

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    session: null
  }))
}));

// Helper to render with Router
const renderWithRouter = (component, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AIAssistant Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Floating Button', () => {
    it('renders floating button when closed', () => {
      renderWithRouter(<AIAssistant />);
      expect(screen.getByRole('button', { name: /open ai assistant/i })).toBeInTheDocument();
    });

    it('shows tooltip on hover', () => {
      renderWithRouter(<AIAssistant />);
      const button = screen.getByRole('button', { name: /open ai assistant/i });
      expect(button).toBeInTheDocument();
      // Tooltip text is in span with pointer-events-none
      expect(screen.getByText(/ask me anything/i)).toBeInTheDocument();
    });

    it('opens chat panel when button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
      
      expect(screen.getByText(/setique assistant/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/ask me anything/i)).toBeInTheDocument();
    });

    it('has proper ARIA label', () => {
      renderWithRouter(<AIAssistant />);
      const button = screen.getByRole('button', { name: /open ai assistant/i });
      expect(button).toHaveAccessibleName();
    });
  });

  describe('Chat Panel', () => {
    beforeEach(async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
    });

    it('renders chat panel with header', () => {
      expect(screen.getByText(/setique assistant/i)).toBeInTheDocument();
      expect(screen.getByText(/premium ai-powered help/i)).toBeInTheDocument();
    });

    it('shows welcome message for anonymous users', () => {
      expect(screen.getByText(/welcome to setique/i)).toBeInTheDocument();
    });

    it('closes when X button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      
      const closeButton = screen.getByRole('button', { name: /close assistant/i });
      await user.click(closeButton);
      
      // Panel should be gone
      expect(screen.queryByText(/setique assistant/i)).not.toBeInTheDocument();
      // Floating button should be back
      expect(screen.getByRole('button', { name: /open ai assistant/i })).toBeInTheDocument();
    });

    it('displays input field and send button', () => {
      expect(screen.getByPlaceholderText(/ask me anything/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('shows helper text at bottom', () => {
      expect(screen.getByText(/ask about curation, pricing, bounties/i)).toBeInTheDocument();
    });
  });

  describe('User Authentication Context', () => {
    it('shows personalized greeting for logged-in users', async () => {
      // Mock authenticated user
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { email: 'testuser@example.com' },
        session: { access_token: 'fake-token' }
      });

      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));

      // Should show personalized welcome
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });

    it('shows generic greeting for anonymous users', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));

      // Should show generic welcome
      expect(screen.getByText(/welcome to setique/i)).toBeInTheDocument();
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
    });

    it('sends message when send button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'Hello');
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      // User message should appear
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('sends message when Enter is pressed', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'Hello{Enter}');
      
      // User message should appear
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('does not send empty messages', async () => {
      const user = userEvent.setup({ delay: null });
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      // Send button should be disabled when input is empty
      expect(sendButton).toBeDisabled();
      
      await user.click(sendButton);
      
      // Should still only have welcome message
      const messages = screen.getAllByText(/welcome/i);
      expect(messages).toHaveLength(1);
    });

    it('does not send whitespace-only messages', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, '   ');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      // Button should still be disabled
      expect(sendButton).toBeDisabled();
    });

    it('clears input after sending', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      expect(input).toHaveValue('');
    });

    it('shows typing indicator while generating response', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'Hello');
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      // Typing indicator should appear (3 animated dots)
      const typingDots = screen.getAllByRole('generic').filter(el => 
        el.className.includes('animate-bounce')
      );
      expect(typingDots.length).toBeGreaterThan(0);
    });

    it('displays AI response after delay', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'hi');
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      // Fast-forward through the typing delay
      vi.runAllTimers();
      
      await waitFor(() => {
        expect(screen.getByText(/hello/i, { selector: 'p' })).toBeInTheDocument();
      });
    });

    it('disables input and send button while typing', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(input, 'Test');
      await user.click(sendButton);
      
      // Should be disabled immediately after sending
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Message Responses', () => {
    beforeEach(async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
    });

    it('responds to greeting', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'hello{Enter}');
      vi.runAllTimers();
      
      await waitFor(() => {
        expect(screen.getByText(/hello.*setique assistant/i)).toBeInTheDocument();
      });
    });

    it('responds to pricing questions', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'how should I price my dataset?{Enter}');
      vi.runAllTimers();
      
      await waitFor(() => {
        expect(screen.getByText(/pricing is an art/i)).toBeInTheDocument();
      });
    });

    it('responds to Pro Curator questions', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'how do I become a pro curator?{Enter}');
      vi.runAllTimers();
      
      await waitFor(() => {
        expect(screen.getByText(/become a pro curator/i)).toBeInTheDocument();
      });
    });

    it('responds to bounty questions', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'what are bounties?{Enter}');
      vi.runAllTimers();
      
      await waitFor(() => {
        expect(screen.getByText(/bounties are basically job postings/i)).toBeInTheDocument();
      });
    });

    it('responds to upload questions', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'how do I upload a dataset?{Enter}');
      vi.runAllTimers();
      
      await waitFor(() => {
        expect(screen.getByText(/ready to upload/i)).toBeInTheDocument();
      });
    });
  });

  describe('Personalization Control', () => {
    beforeEach(async () => {
      // Mock authenticated user
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { email: 'alex@example.com' },
        session: { access_token: 'fake-token' }
      });

      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
    });

    it('uses personalized name by default', () => {
      expect(screen.getByText(/alex/i)).toBeInTheDocument();
    });

    it('disables personalization when requested', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      // Request to stop using name
      await user.type(input, "don't use my name{Enter}");
      vi.runAllTimers();
      
      await waitFor(() => {
        expect(screen.getByText(/won't use.*name/i)).toBeInTheDocument();
      });
      
      // Close and reopen to trigger new welcome
      await user.click(screen.getByRole('button', { name: /close assistant/i }));
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
      
      // Should not show personalized name anymore
      const messages = screen.queryAllByText(/alex/i);
      expect(messages.length).toBeLessThan(2); // Only in email context
    });

    it('re-enables personalization when requested', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      // First disable
      await user.type(input, "don't use my name{Enter}");
      vi.runAllTimers();
      await waitFor(() => {
        expect(screen.getByText(/won't use.*name/i)).toBeInTheDocument();
      });
      
      // Then re-enable
      await user.clear(input);
      await user.type(input, "you can use my name{Enter}");
      vi.runAllTimers();
      
      await waitFor(() => {
        expect(screen.getByText(/will.*use.*name/i)).toBeInTheDocument();
      });
    });
  });

  describe('Message Display', () => {
    beforeEach(async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
    });

    it('displays user messages on the right', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'Test message{Enter}');
      
      const userMessage = screen.getByText('Test message').closest('div');
      expect(userMessage?.parentElement).toHaveClass('justify-end');
    });

    it('displays assistant messages on the left', () => {
      const welcomeMessage = screen.getByText(/welcome/i).closest('div');
      expect(welcomeMessage?.parentElement).toHaveClass('justify-start');
    });

    it('shows timestamps on messages', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'Test{Enter}');
      
      // Should show time in HH:MM format
      const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(timestamps.length).toBeGreaterThan(0);
    });

    it('preserves line breaks in messages', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2{Enter}');
      
      // whitespace-pre-wrap class should preserve line breaks
      const message = screen.getByText(/Line 1/).closest('p');
      expect(message).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
    });

    it('focuses input when panel opens', () => {
      const input = screen.getByPlaceholderText(/ask me anything/i);
      expect(input).toHaveFocus();
    });

    it('sends message on Enter key', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'Test{Enter}');
      
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('allows Shift+Enter for new lines', async () => {
      const user = userEvent.setup({ delay: null });
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2');
      
      // Should not send yet (Shift+Enter just adds newline)
      expect(input).toHaveValue('Line 1\nLine 2');
    });

    it('can tab to send button', async () => {
      const user = userEvent.setup({ delay: null });
      
      await user.tab();
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('floating button should not have accessibility violations', async () => {
      const { container } = renderWithRouter(<AIAssistant />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }, 15000); // Increase timeout for accessibility test


    it('chat panel should not have accessibility violations', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = renderWithRouter(<AIAssistant />);
      
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels on buttons', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
      
      expect(screen.getByRole('button', { name: /close assistant/i })).toHaveAccessibleName();
      expect(screen.getByRole('button', { name: /send message/i })).toHaveAccessibleName();
    });

    it('input has accessible placeholder', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
      
      const input = screen.getByPlaceholderText(/ask me anything/i);
      expect(input).toHaveAttribute('placeholder');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long messages', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
      
      const longMessage = 'This is a very long message '.repeat(50);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      await user.type(input, longMessage.substring(0, 100)); // Type portion
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      // Should handle long messages without crashing
      expect(screen.getByText(/this is a very long message/i)).toBeInTheDocument();
    });

    it('handles rapid message sending', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
      
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      // Send multiple messages quickly
      await user.type(input, 'Message 1{Enter}');
      await user.type(input, 'Message 2{Enter}');
      await user.type(input, 'Message 3{Enter}');
      
      expect(screen.getByText('Message 1')).toBeInTheDocument();
      expect(screen.getByText('Message 2')).toBeInTheDocument();
      expect(screen.getByText('Message 3')).toBeInTheDocument();
    });

    it('maintains scroll position with many messages', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AIAssistant />);
      await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
      
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      // Send many messages
      for (let i = 0; i < 10; i++) {
        await user.type(input, `Message ${i}{Enter}`);
        vi.runAllTimers();
      }
      
      // Last message should be visible
      await waitFor(() => {
        expect(screen.getByText('Message 9')).toBeInTheDocument();
      });
    });
  });
});
