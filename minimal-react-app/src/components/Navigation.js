import React from 'react';

const Navigation = () => {
  return (
    <div style={{ 
      width: '240px', 
      backgroundColor: '#F5F7FA', 
      minHeight: 'calc(100vh - 60px)',
      padding: '20px',
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          padding: '10px', 
          borderRadius: '4px',
          backgroundColor: '#0055FF',
          color: 'white',
          marginBottom: '5px',
          cursor: 'pointer'
        }}>
          Dashboard
        </div>
        <div style={{ 
          padding: '10px', 
          marginBottom: '5px',
          cursor: 'pointer'
        }}>
          Schedule
        </div>
        <div style={{ 
          padding: '10px', 
          marginBottom: '5px',
          cursor: 'pointer'
        }}>
          Patients
        </div>
        <div style={{ 
          padding: '10px', 
          marginBottom: '5px',
          cursor: 'pointer'
        }}>
          Tasks
        </div>
        <div style={{ 
          padding: '10px', 
          marginBottom: '5px',
          cursor: 'pointer'
        }}>
          Encounters
        </div>
        <div style={{ 
          padding: '10px', 
          marginBottom: '5px',
          cursor: 'pointer'
        }}>
          Settings
        </div>
      </div>
    </div>
  );
};

export default Navigation;
