import React, { ChangeEvent, useState } from 'react';

interface ModeProps {
  mode: string;
  onModeChange: (mode: string) => void;
}

const ModeButtons: React.FC<ModeProps> = ({mode, onModeChange}) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onModeChange(event.target.value);
  };

  return (
    <div>
      <label className="mode-button">
        <input
          type="radio"
          name="mode"
          value="abstracts"
          checked={mode === 'abstracts'}
          onChange={handleChange}
        />
        Abstracts
      </label>
      <label className="mode-button">
        <input
          type="radio"
          name="mode"
          value="fulltext"
          checked={mode === 'fulltext'}
          onChange={handleChange}
        />
        Full Articles (Open Access Only)
      </label>
    </div>
  );
};

export default ModeButtons;