/**
 * ApiResponse.js — Standard success response shape.
 * Every successful controller response uses this so the client
 * always gets { success, statusCode, message, data }.
 */
class ApiResponse {
    /**
     * @param {number} statusCode  HTTP status code (2xx)
     * @param {*}      data        Payload (object, array, null)
     * @param {string} message     Human-readable success message
     */
    constructor(statusCode, data, message = 'Success') {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export { ApiResponse };
