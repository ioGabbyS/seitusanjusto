
// GLOBAL ERROR TRAP - Runs before anything else
window.addEventListener('error', (event) => {
    const errorBox = document.getElementById('error-trap') || document.createElement('div');
    errorBox.id = 'error-trap';
    errorBox.style.position = 'fixed';
    errorBox.style.top = '0';
    errorBox.style.left = '0';
    errorBox.style.width = '100vw';
    errorBox.style.height = '100vh';
    errorBox.style.padding = '20px';
    errorBox.style.backgroundColor = '#8B0000'; // Dark Red
    errorBox.style.color = 'white';
    errorBox.style.zIndex = '999999';
    errorBox.style.fontSize = '18px';
    errorBox.style.overflow = 'auto';
    errorBox.innerHTML = `
        <h1>CRITICAL STARTUP ERROR</h1>
        <p><strong>Message:</strong> ${event.message}</p>
        <p><strong>Source:</strong> ${event.filename}:${event.lineno}:${event.colno}</p>
        <pre>${event.error ? event.error.stack : 'No stack trace'}</pre>
    `;
    document.body.appendChild(errorBox);
});

console.log("DEBUG: Error trap installed.");
