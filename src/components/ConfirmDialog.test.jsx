import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <ConfirmDialog {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders dialog when isOpen is true', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('displays default button text', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('displays custom button text', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmText="Delete Forever"
          cancelText="Keep It"
        />
      );
      expect(screen.getByRole('button', { name: /delete forever/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /keep it/i })).toBeInTheDocument();
    });

    it('displays danger variant styles by default', () => {
      render(<ConfirmDialog {...defaultProps} />);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('bg-red-500');
    });

    it('displays warning variant styles when specified', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('bg-yellow-500');
    });

    it('displays warning icon for all variants', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
      
      // Find the X button using its aria-label
      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls both onConfirm and onClose when Confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onConfirm = vi.fn();
      
      render(
        <ConfirmDialog
          {...defaultProps}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      );
      
      await user.click(screen.getByRole('button', { name: /confirm/i }));
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm before onClose', async () => {
      const user = userEvent.setup();
      const callOrder = [];
      const onClose = vi.fn(() => callOrder.push('close'));
      const onConfirm = vi.fn(() => callOrder.push('confirm'));
      
      render(
        <ConfirmDialog
          {...defaultProps}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      );
      
      await user.click(screen.getByRole('button', { name: /confirm/i }));
      
      expect(callOrder).toEqual(['confirm', 'close']);
    });
  });

  describe('Keyboard Navigation', () => {
    it('can tab to first button (X close button)', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);
      
      await user.tab();
      
      // First focusable element is the X close button
      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      expect(closeButton).toHaveFocus();
    });

    it('can navigate between buttons with Tab', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);
      
      // Tab through all focusable elements
      await user.tab(); // X button
      await user.tab(); // Cancel button
      await user.tab(); // Confirm button
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveFocus();
    });

    it('can activate Cancel button with Enter key', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      cancelButton.focus();
      await user.keyboard('{Enter}');
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('can activate Confirm button with Enter key', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      confirmButton.focus();
      await user.keyboard('{Enter}');
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper heading hierarchy', () => {
      render(<ConfirmDialog {...defaultProps} />);
      const heading = screen.getByRole('heading', { name: /confirm action/i });
      expect(heading).toBeInTheDocument();
    });

    it('has visible button labels', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      expect(cancelButton).toHaveAccessibleName();
      expect(confirmButton).toHaveAccessibleName();
    });

    it('has adequate color contrast for danger variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Red background with white text should have good contrast
      expect(confirmButton).toHaveClass('text-white');
    });

    it('has adequate color contrast for warning variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Yellow background with black text should have good contrast
      expect(confirmButton).toHaveClass('text-black');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional props gracefully', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          title="Test"
          message="Test message"
        />
      );
      
      expect(container).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('handles empty strings for custom button text', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmText=""
          cancelText=""
        />
      );
      
      // Buttons should still exist even with empty text
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('handles very long message text', () => {
      const longMessage = 'This is a very long message that should wrap properly and not break the dialog layout. '.repeat(10);
      
      render(
        <ConfirmDialog
          {...defaultProps}
          message={longMessage}
        />
      );
      
      // Use partial matching since text might be normalized
      expect(screen.getByText(/This is a very long message that should wrap properly/)).toBeInTheDocument();
    });

    it('handles very long title text', () => {
      const longTitle = 'This is a Very Long Title That Should Not Break The Dialog';
      
      render(
        <ConfirmDialog
          {...defaultProps}
          title={longTitle}
        />
      );
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('does not crash when callbacks are undefined', async () => {
      const user = userEvent.setup();
      
      // This should not throw errors
      render(
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
        />
      );
      
      // Clicking buttons should not crash
      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        await user.click(button);
      }
    });
  });

  describe('Visual Styling', () => {
    it('applies brutalist design with borders and shadows', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      // Check for brutalist styling
      const dialog = screen.getByText('Confirm Action').closest('div');
      expect(dialog?.parentElement).toHaveClass('border-4', 'border-black');
    });

    it('has fixed positioning overlay', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      const overlay = screen.getByText('Confirm Action').closest('div')?.parentElement?.parentElement;
      expect(overlay).toHaveClass('fixed', 'inset-0');
    });

    it('centers dialog on screen', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      const overlay = screen.getByText('Confirm Action').closest('div')?.parentElement?.parentElement;
      expect(overlay).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Integration Scenarios', () => {
    it('simulates complete delete confirmation flow', async () => {
      const user = userEvent.setup();
      let isDeleted = false;
      let isDialogOpen = true;
      
      const handleConfirm = () => {
        isDeleted = true;
      };
      
      const handleClose = () => {
        isDialogOpen = false;
      };
      
      const { rerender } = render(
        <ConfirmDialog
          isOpen={isDialogOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title="Delete Dataset"
          message="This action cannot be undone. Are you sure?"
          confirmText="Delete Forever"
          cancelText="Keep It"
          variant="danger"
        />
      );
      
      // User clicks confirm
      await user.click(screen.getByRole('button', { name: /delete forever/i }));
      
      expect(isDeleted).toBe(true);
      
      // Rerender with closed state
      rerender(
        <ConfirmDialog
          isOpen={false}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title="Delete Dataset"
          message="This action cannot be undone. Are you sure?"
        />
      );
      
      // Dialog should be gone
      expect(screen.queryByText('Delete Dataset')).not.toBeInTheDocument();
    });

    it('simulates user canceling action', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onClose = vi.fn();
      
      render(
        <ConfirmDialog
          {...defaultProps}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      );
      
      // User clicks cancel instead
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
