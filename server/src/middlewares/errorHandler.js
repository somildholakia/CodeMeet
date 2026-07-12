export function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong on our end',
  });
}
