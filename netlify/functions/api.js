export const handler = async (event, context) => {
  const path = event.path;
  
  // Basic routing for /api/health
  if (path === '/api/health' || path === '/.netlify/functions/api') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        status: "ready",
        mode: "netlify_function_node",
        project: "Sanjivani PWA"
      }),
    };
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ error: "Not Found" }),
  };
};
