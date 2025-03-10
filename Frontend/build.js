const { exec } = require('child_process');

exec(
  'node node_modules/tailwindcss/lib/cli.js -i styles.css -o output.css --config tailwind.config.js',
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  }
);
