import React from 'react';

const Dashboard = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#0055FF' }}>Dr. Assistant Dashboard</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px',
        marginTop: '20px'
      }}>
        {/* Today's Schedule Card */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '20px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#1A1D21', marginTop: 0 }}>Today's Schedule</h2>
          <div style={{ marginTop: '10px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '10px',
              borderLeft: '4px solid #0055FF',
              backgroundColor: '#F5F7FA',
              marginBottom: '10px'
            }}>
              <div style={{ marginLeft: '10px' }}>
                <div style={{ fontWeight: 'bold' }}>9:00 AM - 9:30 AM</div>
                <div>Patient: John Doe</div>
                <div style={{ color: '#4A5056', fontSize: '14px' }}>Follow-up Consultation</div>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '10px',
              borderLeft: '4px solid #00B67A',
              backgroundColor: '#F5F7FA',
              marginBottom: '10px'
            }}>
              <div style={{ marginLeft: '10px' }}>
                <div style={{ fontWeight: 'bold' }}>10:00 AM - 10:30 AM</div>
                <div>Patient: Jane Smith</div>
                <div style={{ color: '#4A5056', fontSize: '14px' }}>New Patient Consultation</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Patient Summary Card */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '20px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#1A1D21', marginTop: 0 }}>Patient Summary</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0055FF' }}>12</div>
              <div style={{ color: '#4A5056', fontSize: '14px' }}>Today</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0055FF' }}>45</div>
              <div style={{ color: '#4A5056', fontSize: '14px' }}>This Week</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0055FF' }}>156</div>
              <div style={{ color: '#4A5056', fontSize: '14px' }}>This Month</div>
            </div>
          </div>
        </div>
        
        {/* Tasks Card */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '20px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#1A1D21', marginTop: 0 }}>Tasks</h2>
          <div style={{ marginTop: '10px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '10px',
              backgroundColor: '#F5F7FA',
              marginBottom: '10px',
              borderRadius: '4px'
            }}>
              <input type="checkbox" id="task1" />
              <label htmlFor="task1" style={{ marginLeft: '10px' }}>Review lab results for Patient #1234</label>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '10px',
              backgroundColor: '#F5F7FA',
              marginBottom: '10px',
              borderRadius: '4px'
            }}>
              <input type="checkbox" id="task2" />
              <label htmlFor="task2" style={{ marginLeft: '10px' }}>Complete medical certificate for Jane Smith</label>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '10px',
              backgroundColor: '#F5F7FA',
              marginBottom: '10px',
              borderRadius: '4px'
            }}>
              <input type="checkbox" id="task3" />
              <label htmlFor="task3" style={{ marginLeft: '10px' }}>Follow up on referral for John Doe</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
