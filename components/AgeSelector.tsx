import React from 'react';

interface AgeSelectorProps {
  selectedAge: string;
  onAgeChange: (age: string) => void;
  disabled: boolean;
}

const ageOptions = [
  'Child (3-10)',
  'Teenager (11-18)',
  'Young Adult (19-30)',
  'Adult (31-50)',
  'Senior (50+)',
];

const AgeSelector: React.FC<AgeSelectorProps> = ({ selectedAge, onAgeChange, disabled }) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 transition-opacity duration-300 ${disabled ? 'opacity-50' : 'opacity-100'}`}>
      {ageOptions.map((age) => (
        <button
          key={age}
          onClick={() => onAgeChange(age)}
          disabled={disabled}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface focus:ring-brand-secondary disabled:cursor-not-allowed
            ${
              selectedAge === age
                ? 'bg-brand-secondary text-brand-bg shadow-md'
                : 'bg-black/30 text-brand-text-secondary hover:bg-black/50 hover:text-brand-text'
            }
          `}
          aria-pressed={selectedAge === age}
        >
          {age}
        </button>
      ))}
    </div>
  );
};

export default AgeSelector;
