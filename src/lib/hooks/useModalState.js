import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal state with associated data
 * Consolidates open/close state and data passing for modals
 * 
 * @param {*} initialData - Initial data value (default: null)
 * @returns {Object} Modal state and control functions
 * 
 * @example
 * const modal = useModalState();
 * modal.open({ userId: 123 });
 * modal.close();
 * console.log(modal.isOpen, modal.data);
 * 
 * @example Multiple modals
 * const uploadModal = useModalState();
 * const editModal = useModalState();
 * const deleteModal = useModalState();
 */
export const useModalState = (initialData = null) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(initialData);

  /**
   * Open the modal with optional data
   * @param {*} modalData - Data to pass to the modal
   */
  const open = useCallback((modalData = null) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  /**
   * Close the modal and optionally clear data
   * @param {boolean} clearData - Whether to reset data to initial value
   */
  const close = useCallback((clearData = true) => {
    setIsOpen(false);
    if (clearData) {
      setData(initialData);
    }
  }, [initialData]);

  /**
   * Toggle the modal state
   * @param {*} modalData - Data to pass when opening
   */
  const toggle = useCallback((modalData = null) => {
    if (isOpen) {
      close();
    } else {
      open(modalData);
    }
  }, [isOpen, open, close]);

  /**
   * Update modal data without changing open state
   * @param {*} newData - New data value
   */
  const updateData = useCallback((newData) => {
    setData(newData);
  }, []);

  /**
   * Reset modal to initial state
   */
  const reset = useCallback(() => {
    setIsOpen(false);
    setData(initialData);
  }, [initialData]);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    updateData,
    reset,
    // Convenience getters for common patterns
    setOpen: setIsOpen,
    setData: setData,
  };
};

/**
 * Hook for managing confirmation dialogs
 * Specialized version of useModalState with confirmation-specific API
 * 
 * @returns {Object} Confirmation dialog state and control functions
 * 
 * @example
 * const confirm = useConfirmDialog();
 * confirm.show({
 *   title: 'Delete Item',
 *   message: 'Are you sure?',
 *   onConfirm: () => deleteItem()
 * });
 */
export const useConfirmDialog = () => {
  const modal = useModalState({
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: null,
  });

  /**
   * Show confirmation dialog
   * @param {Object} config - Dialog configuration
   * @param {string} config.title - Dialog title
   * @param {string} config.message - Dialog message
   * @param {Function} config.onConfirm - Callback when confirmed
   * @param {Function} [config.onCancel] - Optional callback when cancelled
   */
  const show = useCallback((config) => {
    modal.open({
      title: config.title || '',
      message: config.message || '',
      onConfirm: config.onConfirm || (() => {}),
      onCancel: config.onCancel || null,
    });
  }, [modal]);

  /**
   * Confirm and execute the onConfirm callback
   */
  const confirm = useCallback(() => {
    if (modal.data?.onConfirm) {
      modal.data.onConfirm();
    }
    modal.close();
  }, [modal]);

  /**
   * Cancel and optionally execute onCancel callback
   */
  const cancel = useCallback(() => {
    if (modal.data?.onCancel) {
      modal.data.onCancel();
    }
    modal.close();
  }, [modal]);

  return {
    isOpen: modal.isOpen,
    title: modal.data?.title || '',
    message: modal.data?.message || '',
    show,
    confirm,
    cancel,
    close: modal.close,
  };
};

export default useModalState;
