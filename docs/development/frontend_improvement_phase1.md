# Frontend Improvement Plan - Phase 1

## Objectives
1. Upgrade tech stack to modern frameworks
2. Implement theme context with light/dark modes
3. Create foundational UI components
4. Establish CI/CD pipeline for frontend

## Timeline: 2 days

## Technology Stack
- **Build System**: Vite
- **Styling**: Tailwind CSS + PostCSS
- **UI Components**: Headless UI + Radix UI
- **State Management**: Zustand
- **Animation**: Framer Motion
- **Testing**: Jest + React Testing Library

## Phase 1 Tickets

### Ticket 1: Dependency Installation and Configuration
```markdown
### Install and configure new dependencies
- [ ] Add Vite build system: `npm install vite @vitejs/plugin-react vite-plugin-svgr`
- [ ] Install Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer`
- [ ] Add UI libraries: `npm install @headlessui/react @radix-ui/react-slot`
- [ ] Install animation library: `npm install framer-motion`
- [ ] Add state management: `npm install zustand`
- [ ] Configure `vite.config.js` with Tailwind and React plugins
- [ ] Set up `tailwind.config.js` with theme colors
- [ ] Create `postcss.config.js` for processing
```

### Ticket 2: Theme Context Implementation
```markdown
### Create theme context with light/dark modes
- [ ] Create `src/context/ThemeContext.tsx`:
  ```tsx
  import { createContext, useContext, useState, useEffect } from 'react';

  type Theme = 'light' | 'dark';
  type ThemeContextType = {
    theme: Theme;
    toggleTheme: () => void;
  };

  const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

  export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light');
    
    useEffect(() => {
      const savedTheme = localStorage.getItem('theme') as Theme || 'light';
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }, []);
    
    const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };
    
    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  };
  
  export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
      throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
  };
  ```
- [ ] Wrap application in `ThemeProvider` in `src/main.tsx`
- [ ] Create theme toggle component in `src/components/ThemeToggle.tsx`
```

### Ticket 3: Core Component Redesign
```markdown
### Redesign core UI components with Tailwind
- [ ] Create `src/components/ui/Button.tsx`:
  ```tsx
  import { cva, type VariantProps } from 'class-variance-authority';
  import { motion } from 'framer-motion';
  
  const buttonVariants = cva(
    'rounded-lg font-medium transition-all duration-200',
    {
      variants: {
        variant: {
          primary: 'bg-primary-600 hover:bg-primary-700 text-white',
          secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white',
          outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50',
        },
        size: {
          sm: 'py-1 px-3 text-sm',
          md: 'py-2 px-4 text-base',
          lg: 'py-3 px-6 text-lg',
        },
      },
      defaultVariants: {
        variant: 'primary',
        size: 'md',
      },
    }
  );
  
  interface ButtonProps 
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
      VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
  }
  
  export const Button = ({ 
    className, 
    variant, 
    size, 
    isLoading = false,
    children, 
    ...props 
  }: ButtonProps) => {
    return (
      <motion.button
        className={buttonVariants({ variant, size, className })}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center">
            <Spinner className="mr-2" />
            Loading...
          </span>
        ) : children}
      </motion.button>
    );
  };
  ```
  
- [ ] Create `src/components/ui/Card.tsx`:
  ```tsx
  import { motion } from 'framer-motion';
  
  export const Card = ({ children, className = '' }) => {
    return (
      <motion.div
        className={`rounded-xl bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-700/30 p-6 ${className}`}
        whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  };
  ```
```

### Ticket 4: Layout Components
```markdown
### Create responsive layout components
- [ ] Build `src/components/layout/MainLayout.tsx`:
  ```tsx
  import { Outlet } from 'react-router-dom';
  import { Sidebar } from './Sidebar';
  import { Header } from './Header';
  
  export const MainLayout = () => {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    );
  };
  ```
  
- [ ] Create animated `src/components/layout/Sidebar.tsx` with collapsible state
- [ ] Build `src/components/layout/Header.tsx` with theme toggle
```

### Ticket 5: Testing Setup
```markdown
### Configure testing environment
- [ ] Install testing deps: `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom`
- [ ] Configure `vitest.config.js`
- [ ] Create test for ThemeContext
- [ ] Add component tests for Button and Card
- [ ] Set up test coverage reporting
```

### Ticket 6: Documentation and CI/CD
```markdown
### Update documentation and CI pipeline
- [ ] Add Storybook: `npx storybook init`
- [ ] Document components in Storybook
- [ ] Update README with new setup instructions
- [ ] Configure GitHub Actions for:
  - Automated testing
  - Storybook deployment
  - Vercel preview deployments
```

## Success Metrics
1. Theme switching working with localStorage persistence
2. 5 core components redesigned with animations
3. Test coverage > 70% for new components
4. CI pipeline running tests on every push
5. Storybook documentation for all new components

## Next Steps
1. Get approval for implementation
2. Begin Phase 2: Dashboard redesign
3. Implement 3D visualization components
