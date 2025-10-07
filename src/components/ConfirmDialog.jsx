import { X } from 'lucide-react'

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger' // 'danger' or 'warning'
}) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      button: 'bg-red-500 hover:bg-red-600 text-white',
      icon: '⚠️'
    },
    warning: {
      button: 'bg-yellow-500 hover:bg-yellow-600 text-black',
      icon: '⚠️'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border-4 border-black max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-4 border-black">
          <h3 className="text-xl font-extrabold flex items-center gap-2">
            <span className="text-2xl">{styles.icon}</span>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t-4 border-black bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 bg-white text-black font-bold px-4 py-3 rounded-full border-2 border-black hover:scale-105 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              if (onConfirm) onConfirm()
              if (onClose) onClose()
            }}
            className={`flex-1 font-bold px-4 py-3 rounded-full border-2 border-black hover:scale-105 transition ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
