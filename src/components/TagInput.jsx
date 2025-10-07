import { useState } from 'react'

export const TagInput = ({ tags, setTags, onChange, disabled, placeholder }) => {
  const [inputValue, setInputValue] = useState('')
  
  // Support both setTags and onChange props
  const updateTags = onChange || setTags

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    const value = inputValue.trim()
    if (!value || tags.includes(value)) {
      setInputValue('')
      return
    }
    updateTags([...tags, value])
    setInputValue('')
  }

  const removeTag = (index) => {
    updateTags(tags.filter((_, i) => i !== index))
  }

  return (
    <div className="bg-white border-2 border-black rounded-md p-2 flex flex-wrap gap-2 items-center">
      {tags.map((tag, index) => (
        <div
          key={index}
          className="bg-yellow-200 text-black font-bold text-sm px-2 py-1 rounded-md flex items-center gap-1"
        >
          {tag}
          <button
            onClick={() => removeTag(index)}
            className="font-mono hover:text-red-500"
            type="button"
            disabled={disabled}
          >
            x
          </button>
        </div>
      ))}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        type="text"
        className="flex-grow bg-transparent outline-none font-semibold"
        placeholder={placeholder || (tags.length === 0 ? 'Add labels (e.g., cat, dog)...' : '')}
        disabled={disabled}
      />
    </div>
  )
}
