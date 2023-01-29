let mix = require("laravel-mix");
const tailwindcss = require("tailwindcss");

mix
  .js("src/app.js", "assets")
  .sass("src/app.scss", "assets")
  .options({
    processCssUrls: false,
    postCss: [tailwindcss("tailwind.config.js")],
  });
