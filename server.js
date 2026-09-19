const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// هندل کردن پروکسی پویا برای تمام مسیرها
app.use('/', (req, res, next) => {
  const pathSegments = req.url.replace(/^\/*/, '').split('/');
  const targetAddress = pathSegments[0];

  // صفحه سلامت سرور
  if (!targetAddress || targetAddress === 'healthz') {
    return res.status(200).send('Service Operational');
  }

  // تفکیک آدرس و پورت
  const [hostname, port] = targetAddress.split(':');
  const plainHttpPorts = ['80', '8080', '8880', '2052', '2082', '2086', '2095'];
  const protocol = port && plainHttpPorts.includes(port) ? 'http' : 'https';
  
  const targetUrl = `${protocol}://${hostname}${port ? ':' + port : ''}`;
  const newPath = '/' + pathSegments.slice(1).join('/');

  // ساخت پروکسی با پشتیبانی کامل از WebSocket
  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    ws: true, // پشتیبانی کامل از VLESS/WebSocket
    pathRewrite: () => newPath,
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('Host', hostname);
    },
    onError: (err, req, res) => {
      if (!res.headersSent) {
        res.status(404).send('Not Found');
      }
    }
  });

  return proxy(req, res, next);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});