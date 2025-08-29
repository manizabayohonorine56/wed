// Minimal PostCSS config: no Tailwind plugin required because Tailwind is loaded via CDN in index.html
module.exports = {
	plugins: {
		'@tailwindcss/postcss': {},
		autoprefixer: {}
	}
};
