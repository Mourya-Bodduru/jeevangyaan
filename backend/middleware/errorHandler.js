const errorHandler = async (err, req, res, next) => {
    let statusCode = err.statuscode || 500;
    let message = err.message || "Internal server error";
    if (err.name === "CastError") {
        statusCode = 404;
        message = "Resource not found";
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists`;
        statusCode = 400;
    }
    if (err.name === "ValidationError") {
        message = Object.values(err.errors).map((error) => error.message);
        statusCode = 400;
    }
    if (err.name === "JsonWebTokenError") {
        message = "Invalid token";
        statusCode = 401;
    }
    if (err.name === "TokenExpiredError") {
        message = "Token expired";
        statusCode = 401;
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
        message = "File size is too large";
        statusCode = 400;
    }
    // Log error to console
    console.error('Error:', {
        message: err.message,
        stack: err.stack
    });

    // Log to file for visibility
    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const __dirname = path.dirname((await import('url')).fileURLToPath(import.meta.url));
        const logFile = path.join(__dirname, '../error.log');
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${err.name}: ${err.message}\nStack: ${err.stack}\n\n`;
        await fs.appendFile(logFile, logEntry);
    } catch (fsError) {
        console.error('Failed to write to error log:', fsError);
    }
    res.status(statusCode).json({
        success: false,
        error: message,
        statusCode,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
export default errorHandler;