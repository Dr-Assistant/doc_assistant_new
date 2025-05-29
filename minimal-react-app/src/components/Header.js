import React from 'react';

const Header = () => {
  return (
    <nav style={{
      backgroundColor: '#0055FF',
      color: 'white',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '20px' }}>Dr. Assistant</div>
      <div>
        <button style={{
          backgroundColor: 'transparent',
          border: '1px solid white',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Dr. John Doe
        </button>
      </div>
    </nav>
  );
};

export default Header;
