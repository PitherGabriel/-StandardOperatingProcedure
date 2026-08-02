import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition
} from '@headlessui/react'
import { CaretDown as ChevronDown } from '@phosphor-icons/react';
import { Fragment } from 'react'

export default function PriceSelector({ item, hasTwoPrices, onChange }) {
  const options = [
    {
      value: 'precio',
      label: `$ ${item.precio?.toFixed(3)}`
    },
    item.precio_2 > 0 && {
      value: 'precio_2',
      label: `$ ${item.precio_2?.toFixed(3)}`
    },
    item.precio_3 > 0 && {
      value: 'precio_3',
      label: `$ ${item.precio_3?.toFixed(3)}`
    }
  ].filter(Boolean)

  const selected =
    options.find(o => o.value === item.priceType) || options[0]

  if (!hasTwoPrices) {
    return (
      <span className="text-sm font-semibold">
        $ {item.precio?.toFixed(3)}
      </span>
    )
  }

  return (
    <div className="col-span-3 flex justify-center">
      <Listbox
        value={selected}
        onChange={(option) => onChange(item.id, option.value)}
      >
        <div className="relative w-30">

          {/* Button */}
          <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-white border border-gray-300 py-2 pl-3 pr-10 text-left text-sm shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
            <span className="block truncate text-sm font-bold text-gray-800">{selected.label}</span>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500">
              <ChevronDown className='w-4 h-4'/>
            </span>
          </ListboxButton>

          {/* Dropdown */}
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none z-50 text-sm font-bold text-gray-800">
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option}
                  className={({ active }) =>
                    `cursor-pointer select-none px-3 py-2 transition ${
                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected }) => (
                    <div className="flex justify-between">
                      <span className={selected ? 'font-semibold' : ''}>
                        {option.label}
                      </span>
                      {selected && <span>✓</span>}
                    </div>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>

        </div>
      </Listbox>
    </div>
  )
}