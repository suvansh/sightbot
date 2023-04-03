import React from 'react';

interface CopyIconProps {
  textToCopy: string;
}

function CopyIcon({ textToCopy }: CopyIconProps) {
  const handleClick = async () => {
    try {
        await navigator.clipboard.writeText(textToCopy);
    } catch (error) {
        console.error(`Failed to copy bibtex to clipboard: ${error}`);
    }
  };

  return (
    <button className="bibtex-btn" title='Copy sources as BibTeX' onClick={handleClick}>
        <i className="fa fa-clone" aria-hidden="true"></i>
    </button>
  );
}

export default CopyIcon;