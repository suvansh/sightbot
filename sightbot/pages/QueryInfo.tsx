import React from 'react';

interface QueryInfoProps {
    query: string;
  }
  
  const QueryInfo: React.FC<QueryInfoProps> = ({ query }) => {
    const [isOpen, setIsOpen] = React.useState(false);
  
    const toggleInfo = () => {
      setIsOpen(!isOpen);
    };
  
    return (
        <div>
            <button className="query-info-btn" title='See PubMed query' onClick={toggleInfo}>
                <i className="fa fa-info-circle" aria-hidden="true"></i>
            </button>
            {isOpen && <span className="query-info-text">{query}</span>}
      </div>
    );
  };
  
  export default QueryInfo;
  