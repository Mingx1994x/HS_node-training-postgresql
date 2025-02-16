const errorResponse = (res, headers, statusCode, status, message) => {
  res.writeHead(statusCode, headers);
  res.write(JSON.stringify({
    status,
    message
  }));
  res.end();
}

module.exports = errorResponse;