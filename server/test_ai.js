async function testAI() {
    try {
        console.log('Registering test user...');
        const email = `test_${Date.now()}@example.com`;
        const regRes = await fetch('http://localhost:5000/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email,
                password: 'Password123!'
            })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(JSON.stringify(regData));
        const token = regData.data.tokens.accessToken;
        console.log('Registered successfully. Token:', token.substring(0, 20) + '...');

        console.log('Starting interview...');
        const startRes = await fetch('http://localhost:5000/api/v1/interviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                job_role: 'Software Engineer',
                difficulty: 'medium'
            })
        });
        const startData = await startRes.json();
        if (!startRes.ok) throw new Error(JSON.stringify(startData));
        const interviewId = startData.data.interview._id;
        console.log('Interview started. ID:', interviewId);

        console.log('Getting next question...');
        const nextQRes = await fetch(`http://localhost:5000/api/v1/interviews/${interviewId}/next-question`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const nextQData = await nextQRes.json();
        if (!nextQRes.ok) throw new Error(JSON.stringify(nextQData));
        const question = nextQData.data.question;
        console.log('Question:', question.question);

        console.log('Submitting answer...');
        const ansRes = await fetch(`http://localhost:5000/api/v1/interviews/${interviewId}/answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                question_id: question._id,
                text_answer: 'I have experience with React and Node.js. I built a full-stack application using the MERN stack.',
                duration_seconds: 10
            })
        });
        const ansData = await ansRes.json();
        if (!ansRes.ok) throw new Error(JSON.stringify(ansData));
        console.log('Answer evaluated successfully.');
        console.log('Score:', ansData.data.question.evaluation.score);
        console.log('Feedback:', ansData.data.question.evaluation.feedback);

        console.log('Ending interview...');
        const endRes = await fetch(`http://localhost:5000/api/v1/interviews/${interviewId}/end`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const endData = await endRes.json();
        if (!endRes.ok) throw new Error(JSON.stringify(endData));
        console.log('Interview ended successfully.');
        console.log('Overall Score:', endData.data.report.sessionMetrics.overallScore);

        console.log('ALL TESTS PASSED.');
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testAI();
