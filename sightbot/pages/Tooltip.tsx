import React from 'react';

interface TooltipProps {
    content: React.ReactNode;
  }
  
  const Tooltip: React.FC<TooltipProps> = ({ content }) => {
    const [isOpen, setIsOpen] = React.useState(false);
  
    const toggleTooltip = () => {
      setIsOpen(!isOpen);
    };
  
    return (
      <div className="tooltip" onClick={toggleTooltip}>
        <span className="questionMark">?</span>
        {isOpen && <div className="tooltipText">{content}</div>}
      </div>
    );
  };
  
  export default Tooltip;
  