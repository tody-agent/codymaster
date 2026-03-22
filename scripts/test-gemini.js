const { exec, spawn } = require('child_process');

// Method 1: exec
exec('gemini -y -p "Hello!"', (err, stdout, stderr) => {
    console.log('EXEC Result:', stdout || stderr);
});

// Method 2: spawn
const child = spawn('gemini', ['-y', '-p', 'Hello!']);
let out = '';
child.stdout.on('data', d => out += d);
child.stderr.on('data', d => out += d);
child.on('close', () => console.log('SPAWN Result:', out));
