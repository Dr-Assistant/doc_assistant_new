// This file contains global type definitions

// Declare modules for importing non-JavaScript files
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Extend the Window interface
interface Window {
  // Add any custom window properties here
}

// Extend the NodeJS namespace
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    REACT_APP_API_URL: string;
    REACT_APP_AUTH_API_URL: string;
    REACT_APP_ENABLE_VOICE_RECORDING: string;
    REACT_APP_ENABLE_AI_TRANSCRIPTION: string;
    REACT_APP_ANALYTICS_ENABLED: string;
  }
}
