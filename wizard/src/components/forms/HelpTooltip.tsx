import { useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface HelpTooltipProps {
  text: string;
  id?: string;
}

export function HelpTooltip({ text, id }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="group relative inline-block ml-1">
      <button
        type="button"
        aria-label="Show help information"
        aria-expanded={isOpen}
        aria-describedby={id}
        onKeyDown={handleKeyDown}
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setIsOpen(false)}
        className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded-full"
      >
        <QuestionMarkCircleIcon
          className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help"
          aria-hidden="true"
        />
      </button>
      <div
        id={id}
        role="tooltip"
        className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 z-10 ${
          isOpen ? 'block' : 'hidden group-hover:block'
        }`}
      >
        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>
    </div>
  );
}
