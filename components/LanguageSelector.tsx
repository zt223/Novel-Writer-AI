
import React from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
  selectedLang: Language;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLang }) => {
  const displayName = selectedLang === Language.EN ? 'English' : '中文';
  return (
    <div className="flex items-center mb-2">
      <span className="px-3 py-1 bg-gray-700 text-gray-300 text-sm font-semibold rounded-md">
        {displayName}
      </span>
    </div>
  );
};
