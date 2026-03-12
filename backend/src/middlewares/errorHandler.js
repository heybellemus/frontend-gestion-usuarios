const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  // Errores de SQL Server
  if (err.name === 'ConnectionError' || err.name === 'RequestError') {
    return res.status(503).json({
      success: false,
      message: 'Error de conexión con la base de datos',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Errores de validación
  if (err.message.includes('ya está registrado') || err.message.includes('no encontrado')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Error general
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;