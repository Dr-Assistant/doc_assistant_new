import React from 'react';
import Header from './Header';
import Navigation from './Navigation';

const Layout = ({ children }) => {
  return (
    <div>
      <Header />
      <div style={{ display: 'flex' }}>
        <Navigation />
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
