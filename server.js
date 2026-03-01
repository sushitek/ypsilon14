const express = require('express');
const app = express();
const PORT = 3001;

// Allow requests from the React app (CORS)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

let adminUnlocked = false;

// Get current admin status
app.get('/admin/status', (req, res) => {
    res.json({ admin: adminUnlocked });
});

// Turn admin on
app.get('/admin/on', (req, res) => {
    adminUnlocked = true;
    res.send('Admin unlocked');
});

// Turn admin off
app.get('/admin/off', (req, res) => {
    adminUnlocked = false;
    res.send('Admin locked');
});

app.listen(PORT, () => {
    console.log(`Admin server running at http://localhost:${PORT}`);
    console.log(`  Unlock: http://localhost:${PORT}/admin/on`);
    console.log(`  Lock:   http://localhost:${PORT}/admin/off`);
});
