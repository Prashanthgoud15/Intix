import request from 'supertest';
import app from '../app.js';

describe('Health Check API', () => {
    it('should return 200 OK for the health endpoint', async () => {
        const res = await request(app).get('/api/v1/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message', 'Server is healthy');
    });
});
