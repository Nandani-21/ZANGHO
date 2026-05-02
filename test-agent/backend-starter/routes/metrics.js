const express = require('express');
const router  = express.Router();

// SSE endpoint for streaming metrics
router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendMetrics = () => {
    const data = {
      resolutionRate: [
        { name: 'Mon', rate: Math.floor(70 + Math.random() * 30) },
        { name: 'Tue', rate: Math.floor(70 + Math.random() * 30) },
        { name: 'Wed', rate: Math.floor(70 + Math.random() * 30) },
        { name: 'Thu', rate: Math.floor(70 + Math.random() * 30) },
        { name: 'Fri', rate: Math.floor(70 + Math.random() * 30) }
      ],
      avgResponseTime: [
        { name: 'Mon', time: Math.floor(5 + Math.random() * 15) },
        { name: 'Tue', time: Math.floor(5 + Math.random() * 15) },
        { name: 'Wed', time: Math.floor(5 + Math.random() * 15) },
        { name: 'Thu', time: Math.floor(5 + Math.random() * 15) },
        { name: 'Fri', time: Math.floor(5 + Math.random() * 15) }
      ],
      customerSatisfaction: [
        { name: 'Mon', score: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)) },
        { name: 'Tue', score: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)) },
        { name: 'Wed', score: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)) },
        { name: 'Thu', score: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)) },
        { name: 'Fri', score: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)) }
      ]
    };
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendMetrics();
  const intervalId = setInterval(sendMetrics, 2000);

  req.on('close', () => {
    clearInterval(intervalId);
  });
});

module.exports = router;
