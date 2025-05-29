import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the components used in App
jest.mock('../pages/Dashboard', () => () => <div data-testid="dashboard">Dashboard</div>);
jest.mock('../pages/Login', () => () => <div data-testid="login">Login</div>);

// Mock the react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: () => <div>Route</div>,
}));

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Route')).toBeTruthy();
  });
});
