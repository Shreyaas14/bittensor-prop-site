/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
	  "./index.html",
	  "./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
	  extend: {
		fontFamily: {
		  sans: ['Everett', 'system-ui', 'sans-serif'],
		  code: ['Fira Code', 'monospace'],
		  'everett': ['Everett', 'Inter', 'system-ui', 'sans-serif'],
		},
		colors: {
		  // Base colors
		  black: '#000000',
		  white: '#FFFFFF',
		  
		  // Background colors
		  background: {
			DEFAULT: '#141414',
			secondary: '#252525',
			tertiary: '#1E1E1E',
		  },
		  
		  // Card colors
		  card: {
			DEFAULT: '#252525',
			hover: '#2E2E2E',
			active: '#323232',
		  },
		  
		  // Text colors
		  text: {
			primary: 'rgb(255, 255, 255)',
			secondary: 'rgb(217, 217, 217)',
			muted: 'rgb(144, 144, 144)',
		  },
		  
		  // Brand colors
		  teal: {
			DEFAULT: '#00DBBC',
			hover: '#00C2A6',
			dark: '#00A58D',
			light: '#4AECD4',
			bg: 'rgba(0, 219, 188, 0.1)',
		  },
		  
		  // Accent colors
		  gradient: {
			teal: '#00DBBC',
			orange: '#FF8B25',
			brown: '#7D6250',
		  },
		  
		  // Border colors
		  border: {
			DEFAULT: '#2B2B2B',
			focus: '#4D4D4D',
			hover: '#3A3A3A',
		  },
		  
		  // Semantic colors
		  error: {
			DEFAULT: '#E53935',
			dark: '#C62828',
			light: '#FFCDD2',
			bg: 'rgba(229, 57, 53, 0.1)',
		  },
		  warning: {
			DEFAULT: '#FF8B25',
			dark: '#EF6C00',
			light: '#FFE0B2',
			bg: 'rgba(255, 139, 37, 0.1)',
		  },
		  success: {
			DEFAULT: '#00DBBC',
			dark: '#00A58D',
			light: '#B3F0E8',
			bg: 'rgba(0, 219, 188, 0.1)',
		  },
		  
		  // Input colors
		  input: {
			bg: '#1E1E1E',
			border: '#2B2B2B',
			focus: '#00DBBC',
			placeholder: 'rgb(144, 144, 144)',
		  },
		},
		fontSize: {
		  'display-lg': ['4rem', { lineHeight: '4.875rem', letterSpacing: '-0.06em' }],
		  'display-md': ['3rem', { lineHeight: '3.75rem', letterSpacing: '-0.06em' }],
		  'display-sm': ['2.5rem', { lineHeight: '3rem', letterSpacing: '-0.06em' }],
		  'header-lg': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.06em' }],
		  'header-md': ['1.5rem', { lineHeight: '1.813rem', letterSpacing: '-0.03em' }],
		  'header-sm': ['1.25rem', { lineHeight: '1.5rem', letterSpacing: '-0.03em' }],
		  'header-xs': ['1rem', { lineHeight: '1.25rem', letterSpacing: '-0.03em' }],
		  'body-lg': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
		  'body-md': ['1rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em' }],
		  'body-sm': ['0.688rem', { lineHeight: '0.813rem', letterSpacing: '-0.03em' }],
		  'label-xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.03em' }],
		  'label-sm': ['0.813rem', { lineHeight: '1rem', letterSpacing: '-0.03em' }],
		  'label-md': ['0.875rem', { lineHeight: '1rem', letterSpacing: '-0.01em' }],
		  'label-lg': ['0.938rem', { lineHeight: '1.125rem', letterSpacing: '-0.01em' }],
		  'button-lg': ['1.25rem', { lineHeight: '1.5rem', letterSpacing: '-0.03em' }],
		  'button-md': ['1rem', { lineHeight: '1.125rem', letterSpacing: '-0.04em' }],
		  'button-sm': ['0.875rem', { lineHeight: '1rem', letterSpacing: '-0.04em' }],
		  'metadata': ['1rem', { lineHeight: '1.313rem', letterSpacing: '-0.03em' }],
		},
		fontWeight: {
		  light: 300,
		  regular: 400,
		  medium: 500,
		},
		borderRadius: {
		  DEFAULT: '12px',
		  'lg': '16px',
		  'xl': '24px',
		},
		boxShadow: {
		  card: '0px 4px 12px rgba(0, 0, 0, 0.1)',
		  'card-hover': '0px 6px 16px rgba(0, 0, 0, 0.2)',
		},
	  },
	},
	plugins: [],
  }