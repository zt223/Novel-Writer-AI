
import React, { useState, useCallback } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

interface CodePanelProps {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  isEditable: boolean;
  isLoading?: boolean;
}

export const CodePanel: React.FC<CodePanelProps> = ({ value, onChange, placeholder, isEditable, isLoading }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (value) {
      navigator.clipboard.writeText(value).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  }, [value]);

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-full bg-gray-800 rounded-lg shadow-inner overflow-hidden border border-gray-700">
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={!isEditable}
        className={`w-full h-full p-4 bg-transparent text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg font-mono text-sm leading-relaxed ${!isEditable ? 'cursor-default' : ''} ${isLoading ? 'opacity-50' : ''}`}
        spellCheck="false"
      />
      {!isEditable && !isLoading && value && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          aria-label="Copy to clipboard"
        >
          {isCopied ? (
            <CheckIcon className="w-5 h-5 text-green-400" />
          ) : (
            <CopyIcon className="w-5 h-5 text-gray-400" />
          )}
        </button>
      )}
    </div>
  );
};
