import { Plus, Minus} from 'lucide-react';


export default function QuantityInput({
  value,
  unit = 'unidad',
  min = 0,
  onChange
}) {
  const step = unit === 'unidad' ? 1 : 0.01

  const handleChange = (val) => {
    if (val === '') return onChange('')
    const num = parseFloat(val)
    if (!isNaN(num) && num >= min) {
      onChange(num)
    }
  }

  const increment = () => {
    const newValue = (parseFloat(value) || 0) + step
    onChange(Number(newValue.toFixed(2)))
  }

  const decrement = () => {
    const newValue = (parseFloat(value) || 0) - step
    if (newValue >= min) {
      onChange(Number(newValue.toFixed(2)))
    }
  }

  return (
    <div className="flex items-center gap-1">

      {/* Minus */}
      <button
        type="button"
        onClick={decrement}
        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-120 transition"
      >
        <Minus className='w-4 h-4'/>
      </button>

      {/* Input (matches selector style) */}
      <div
        className="rounded-lg bg-white border border-gray-300 
                   shadow-sm hover:border-gray-400 
                   focus-within:ring-2 focus-within:ring-blue-500 transition"
      >
        <input
          type="number"
          value={value ?? ''}
          step={step}
          min={min}
          onChange={(e) => handleChange(e.target.value)}
          className="font-bold text-gray-800 w-16 py-2 text-center text-sm bg-transparent 
                     focus:outline-none"
        />
      </div>

      {/* Plus */}
      <button
        type="button"
        onClick={increment}
        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-120 transition"
      >
        <Plus className='w-4 h-4'/>
      </button>

    </div>
  )
}