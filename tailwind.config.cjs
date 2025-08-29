module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,vue,svelte}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8b5cf6',
        accent: '#f97316',
        soft: '#f3e8ff'
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      container: {
        center: true,
        padding: '1.25rem'
      }
    }
  },
  plugins: []
}
