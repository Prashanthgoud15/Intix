import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Intix AI Interview Coach — API',
            version: '1.0.0',
            description:
                'REST API for the Intix AI Interview Coach platform. Handles authentication, resume processing, AI question generation, interview sessions, speech analysis, and session reports.',
            contact: {
                name: 'Intix Team',
            },
        },
        servers: [
            {
                url: '/api/v1',
                description: 'v1 API',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        statusCode: { type: 'integer' },
                        message: { type: 'string' },
                        data: { type: 'object' },
                    },
                },
                ApiError: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        statusCode: { type: 'integer' },
                        message: { type: 'string' },
                        errors: { type: 'array', items: { type: 'object' } },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['user', 'admin'] },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                ResumeProfile: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        user: { type: 'string' },
                        fileName: { type: 'string' },
                        candidateName: { type: 'string' },
                        jobRole: { type: 'string' },
                        skills: { type: 'array', items: { type: 'string' } },
                        projects: { type: 'array', items: { type: 'object' } },
                        interviewPlan: { type: 'array', items: { type: 'object' } },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Interview: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        user: { type: 'string' },
                        jobRole: { type: 'string' },
                        difficulty: { type: 'string', enum: ['easy', 'medium', 'hard', 'expert'] },
                        status: { type: 'string', enum: ['in_progress', 'completed', 'abandoned'] },
                        questions: { type: 'array', items: { type: 'object' } },
                        sessionMetrics: { type: 'object' },
                        finalFeedback: { type: 'object' },
                        startedAt: { type: 'string', format: 'date-time' },
                        completedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Report: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        user: { type: 'string' },
                        interview: { type: 'string' },
                        jobRole: { type: 'string' },
                        sessionMetrics: { type: 'object' },
                        finalFeedback: { type: 'object' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
        tags: [
            { name: 'Health', description: 'Server health check' },
            { name: 'Auth', description: 'User authentication and session management' },
            { name: 'AI', description: 'AI question generation and answer evaluation' },
            { name: 'Resumes', description: 'Resume upload, analysis, and interview plan generation' },
            { name: 'Interviews', description: 'Interview session lifecycle management' },
            { name: 'Reports', description: 'Session reports and analytics' },
        ],
    },
    // Path patterns for JSDoc annotations (add @swagger comments to routes later)
    apis: ['./src/routes/v1/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
