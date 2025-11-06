import React from 'react';

interface CheckboxProps {
  id: string;
  label: React.ReactNode;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ id, label, checked, onChange }) => {
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-50"
      />
      <label htmlFor={id} className="ml-3 text-gray-700">
        {label}
      </label>
    </div>
  );
};