/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
	  "./index.html",
	  "./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
	  extend: {
		fontFamily: {
		  sans: ['Everett', 'sans-serif'],
		},
		colors: {
		  // Base colors
		  black: '#000000',
		  white: '#FFFFFF',
		  grey: '#141414',
		  teal: '#00DBBC',
		  
		  // Gradient colors
		  'gradient-teal': '#00DBBC',
		  'gradient-orange': '#FF8B25',
		  'gradient-brown': '#7D6250',
		  
		  // Background colors
		  background: {
			DEFAULT: '#0C0C0C',
			secondary: '#141414',
		  },
		  card: {
			DEFAULT: '#191919',
			hover: '#202020',
		  },
		  
		  // Text colors
		  text: {
			primary: '#FFFFFF',
			secondary: '#AAAAAA',
			muted: '#888888',
		  },
		  
		  // Border colors
		  border: '#2b2b2b',
		  
		  // Chart colors
		  chart: {
			line: '#00DBBC',
			volume: '#3A3A3A',
			positive: '#00DBBC',
			negative: '#FF8B25',
		  },
		  
		  // Special elements
		  dropdown: {
			bg: '#1A1A1A',
		  },
		  tooltip: {
			bg: '#2A2A2A',
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