/**
 * Hardcoded, role-specific 16-question interview banks used when the
 * candidate skips resume upload.
 *
 * WHY THIS EXISTS: the previous dynamic-mode implementation generated every
 * question live via Groq, one at a time, mid-session. That meant the whole
 * "no resume" interview experience depended on 16 separate, sequential AI
 * calls succeeding — any one Groq hiccup mid-session could stall the
 * interview, and the model didn't reliably ask real language/CS-fundamentals
 * questions (it defaulted to generic system-design questions far too often).
 *
 * These banks are hand-authored to actually feel like a real interview for
 * each role: intro -> technical (language fundamentals + DSA + a role
 * scenario) -> behavioral -> HR -> closing, always exactly 16 questions, with
 * zero AI calls required for the question flow itself. This is also faster,
 * cheaper, and immune to the model going off-structure.
 */

// Shared across every role — a real interview usually includes 1-2 DSA /
// problem-solving questions and one logical-reasoning/aptitude question
// regardless of the specific role, so these are pulled from a common pool
// rather than re-written per bank.
const DSA_POOL = [
    {
        question: "Given an array of integers, how would you find two numbers that add up to a specific target? Walk me through your approach — start with the brute force, then tell me how you'd optimize it.",
        tips: ['Start with the O(n²) brute force (nested loop)', 'Then explain the O(n) hash map approach', 'State the time and space complexity of each'],
    },
    {
        question: "How would you check if a string of brackets — like '{[()]}' — is balanced? Talk me through your approach.",
        tips: ['Think about which data structure naturally fits this (stack)', 'Walk through the algorithm step by step on an example', 'Mention the time/space complexity'],
    },
    {
        question: "How would you find whether a linked list has a cycle in it? What's your approach, and can you do it without extra memory?",
        tips: ["Mention the naive approach (visited set) first", "Then explain Floyd's cycle detection (slow/fast pointers)", 'Explain why the fast pointer catches up if a cycle exists'],
    },
    {
        question: "How would you reverse a linked list — both iteratively and recursively? Walk me through your thinking.",
        tips: ['Explain pointer manipulation step by step', 'Discuss the base case for the recursive version', 'Compare space complexity of both approaches'],
    },
];

const APTITUDE_POOL = [
    {
        question: "If you had three switches outside a room, each controlling one of three light bulbs inside, and you can only enter the room once — how would you figure out which switch controls which bulb?",
        tips: ['Think about what information you can extract besides just on/off', 'Consider using time/heat as an additional signal', 'Explain your full reasoning out loud, not just the answer'],
    },
    {
        question: "You have a 3-litre jug and a 5-litre jug, no markings on either. How would you measure out exactly 4 litres of water?",
        tips: ['Think in terms of states (how much water is in each jug)', 'Walk through the sequence of pours out loud', 'There may be more than one valid solution — explain yours clearly'],
    },
    {
        question: "A team's velocity dropped 30% this sprint but nobody changed anything obvious. How would you go about figuring out why?",
        tips: ['Show a structured, methodical approach to diagnosing the issue', 'Mention what data/metrics you would look at first', 'Explain how you would validate your hypothesis before acting on it'],
    },
];

const HR_QUESTIONS = [
    {
        question: "Why are you interested in this role, and what do you know about what we do?",
        tips: ['Show genuine research into the role/company type', 'Connect your background to why this role fits you', 'Be specific, not generic'],
    },
    {
        question: "Where do you see yourself in the next 3-5 years, and how does this role fit into that?",
        tips: ['Be honest but show ambition aligned with growth in this field', "Don't just say \"I don't know\" — show you've thought about it", 'Connect it back to skills you want to build'],
    },
];

const CLOSING_QUESTION = {
    question: "That's all my questions — do you have any questions for me about the role or the team?",
    tips: ["It's fine to ask about team structure, tech stack, or what success looks like in this role", 'Avoid asking things easily found on the company website', "Asking nothing at all can come across as disengaged — have at least one question ready"],
};

const BEHAVIORAL_QUESTIONS = [
    {
        question: "Tell me about a time you disagreed with a teammate or manager about a technical decision. How did you handle it?",
        tips: ['Use the STAR format: Situation, Task, Action, Result', 'Focus on how you communicated, not just the outcome', 'Show you can disagree respectfully and still move forward'],
    },
    {
        question: "Describe a time you missed a deadline or a project didn't go as planned. What happened, and what did you learn?",
        tips: ['Be honest — interviewers can tell a fake "weakness" story', 'Focus on what you changed afterward, not just what went wrong', 'Keep it concise and end on the lesson learned'],
    },
    {
        question: "Tell me about a time you had to learn a new technology or tool quickly to get a task done.",
        tips: ['Show your learning process, not just the end result', 'Mention specific resources or strategies you used', 'Connect it to how you approach unfamiliar problems generally'],
    },
    {
        question: "Describe a situation where you had to take initiative without being asked.",
        tips: ['Pick a genuine example, even a small one', 'Explain what made you notice the gap or opportunity', 'Be clear about the actual impact of what you did'],
    },
];

function withPhaseMeta(questions, phase, difficulty, category) {
    return questions.map(q => ({ ...q, phase, difficulty, category }));
}

/**
 * Builds a full 16-question static plan for a given phase composition of
 * role-specific technical questions.
 */
function buildBank(roleTechnicalQuestions) {
    const intro = [
        {
            question: 'Tell me about yourself — your background, experience, and what brings you here today.',
            tips: ['Keep it to 2-3 minutes', 'Focus on your professional journey', 'End with why you are interested in this role'],
        },
        {
            question: "What made you want to pursue this specific role, and what do you find most interesting about it?",
            tips: ['Be specific about what draws you to this field', 'Connect it to something concrete in your experience', 'Keep it genuine, not generic'],
        },
    ];

    // 8 technical questions: role-specific fundamentals + 1 shared DSA + 1
    // shared aptitude/logical-reasoning question. Previously this was 4
    // role-specific + 2 DSA + 1 aptitude — with intro/behavioral/HR/closing
    // ALSO shared across every role, that meant 12 of 16 questions (75%)
    // were identical no matter what role you picked, which is exactly why
    // testing several roles back-to-back felt like "the same interview
    // every time." Role-specific content now dominates the technical phase
    // (6 of 8) while still keeping one DSA and one logical-reasoning
    // question, per an explicit request to keep those.
    const technical = [
        ...roleTechnicalQuestions,
        DSA_POOL[0],
        APTITUDE_POOL[0],
    ];

    const all = [
        ...withPhaseMeta(intro, 'warm_up', 'basic', 'Introduction'),
        ...withPhaseMeta(technical, 'technical', 'medium', 'Technical'),
        // Trimmed from 4 to 3 behavioral questions to make room for the
        // extra role-specific technical content above, while still keeping
        // real behavioral coverage (not removed, just rebalanced).
        ...withPhaseMeta(BEHAVIORAL_QUESTIONS.slice(0, 3), 'behavioral', 'medium', 'Behavioral'),
        ...withPhaseMeta(HR_QUESTIONS, 'hr', 'basic', 'HR / Culture Fit'),
        ...withPhaseMeta([CLOSING_QUESTION], 'closing', 'basic', 'Closing'),
    ];

    return all.map((q, i) => ({
        question_number: i + 1,
        phase: q.phase,
        difficulty: q.difficulty,
        category: q.category,
        question: q.question,
        tips: q.tips,
        projectTag: '',
    }));
}

const ROLE_BANKS = {
    'full stack developer': buildBank([
        { question: "What's the difference between a React state update and a prop change — and how does each affect re-rendering?", tips: ['Explain the one-way data flow in React', 'Mention when a component actually re-renders', 'Give a concrete small example'] },
        { question: 'How would you design a REST API endpoint for paginated product listings — what would the request and response look like?', tips: ['Cover query params (page, limit, sort)', 'Mention response metadata (total count, next page)', 'Consider performance for large datasets'] },
        { question: 'How does JavaScript\'s event loop handle asynchronous code, and how does that differ from a purely synchronous language?', tips: ['Mention the call stack, task queue, and microtasks', 'Give an example with setTimeout vs Promise', 'Explain why this matters for Node.js specifically'] },
        { question: "What's the difference between SQL and NoSQL databases, and how would you decide which to use for a given feature?", tips: ['Give concrete examples of each (Postgres vs MongoDB)', 'Discuss consistency vs flexibility trade-offs', 'Relate it to a scenario you might actually build'] },
        { question: "What's the difference between server-side rendering and client-side rendering, and when would you choose one over the other?", tips: ['Discuss initial load time vs interactivity trade-offs', 'Mention SEO implications', 'Give a concrete example of a page that benefits from each'] },
        { question: 'How would you handle authentication state across a full-stack app — where would you store the token, and why?', tips: ['Compare localStorage, cookies, and in-memory storage', 'Discuss XSS/CSRF implications of each', 'Explain how the frontend and backend coordinate on this'] },
    ]),

    'backend developer': buildBank([
        { question: "What's the difference between authentication and authorization, and how would you implement both in an API?", tips: ['Define each term precisely', 'Mention JWT or session-based approaches', 'Discuss where each check happens in the request lifecycle'] },
        { question: 'How would you design a rate limiter for an API — what data structure and strategy would you use?', tips: ['Mention token bucket or sliding window approaches', 'Discuss where state is stored (in-memory vs Redis)', 'Consider what happens under high concurrency'] },
        { question: "What's the difference between a SQL INNER JOIN and a LEFT JOIN, and when would you use each?", tips: ['Use a concrete example with two tables', 'Explain what rows appear in each case', 'Mention a real scenario where this distinction matters'] },
        { question: 'How would you handle a database migration on a live production system with zero downtime?', tips: ['Discuss backward-compatible schema changes', 'Mention the expand-and-contract migration pattern', 'Consider rollback strategy if something goes wrong'] },
        { question: "What's the difference between synchronous and asynchronous request handling in a backend service, and when does it actually matter?", tips: ['Explain blocking vs non-blocking I/O', 'Give an example workload where async genuinely helps', 'Mention any trade-offs (complexity, debugging)'] },
        { question: 'How would you design a caching layer for a frequently-read, rarely-written API endpoint?', tips: ['Discuss cache invalidation strategy', 'Mention where the cache lives (in-memory, Redis, CDN)', 'Consider cache stampede / thundering herd'] },
    ]),

    'frontend developer': buildBank([
        { question: "What's the difference between the Virtual DOM and the real DOM, and why does React use it?", tips: ['Explain the diffing/reconciliation process', 'Mention why direct DOM manipulation is expensive', 'Give a concrete performance example'] },
        { question: 'How would you optimize a web page that loads slowly due to a large JavaScript bundle?', tips: ['Mention code splitting and lazy loading', 'Discuss tree shaking and removing unused dependencies', 'Consider image/asset optimization too'] },
        { question: "What's the difference between CSS Flexbox and Grid, and when would you reach for each?", tips: ['Give a concrete layout example for each', 'Mention one-dimensional vs two-dimensional layout', "Don't just recite definitions — relate it to real UI work"] },
        { question: 'How does browser caching work for static assets, and how would you make sure users get updates without manually clearing cache?', tips: ['Mention cache headers (Cache-Control, ETag)', 'Discuss cache-busting via filename hashing', 'Explain the trade-off between caching aggressively and freshness'] },
        { question: "What's the difference between controlled and uncontrolled components in React, and when would you use each?", tips: ['Define what "controlled" actually means (state-driven value)', 'Give an example of a real use case for uncontrolled inputs', 'Mention form libraries as context if relevant'] },
        { question: 'How would you go about debugging a memory leak in a single-page application?', tips: ['Mention browser dev tools (heap snapshots, performance profiler)', 'Discuss common causes (event listeners, closures, detached DOM nodes)', 'Describe your actual step-by-step process'] },
    ]),

    'python developer': buildBank([
        { question: "What's the difference between a Python list and a tuple, and when would you use each?", tips: ['Discuss mutability as the core distinction', 'Mention performance implications', 'Give an example of when immutability actually matters'] },
        { question: "What is Python's GIL (Global Interpreter Lock), and how does it affect multithreaded programs?", tips: ['Explain what the GIL actually prevents', 'Discuss when multiprocessing is used instead of threading', 'Mention I/O-bound vs CPU-bound workloads'] },
        { question: "What's the difference between a Python list comprehension and a generator expression?", tips: ['Discuss memory usage differences', 'Mention lazy evaluation', 'Give an example where you would prefer one over the other'] },
        { question: 'How do Python decorators work, and can you describe a real use case for one?', tips: ['Explain functions as first-class objects', 'Walk through what happens when a decorator is applied', 'Give a concrete example like logging or caching'] },
        { question: "What's the difference between *args and **kwargs in Python, and when would you actually use them?", tips: ['Explain what each collects (positional vs keyword)', 'Give a concrete example of a function signature using both', 'Mention a real scenario like wrapping another function'] },
        { question: "How does Python's context manager (the 'with' statement) work, and can you describe a real use case for one?", tips: ['Explain __enter__ and __exit__ at a high level', 'Give the classic file-handling example', 'Mention a custom context manager use case if you can'] },
    ]),

    'java developer': buildBank([
        { question: "What's the difference between ArrayList and LinkedList in Java, and when would you use each?", tips: ['Discuss underlying data structure for each', 'Compare time complexity for insertion/access', 'Give a concrete scenario for each choice'] },
        { question: 'How does Java handle memory management, and what is the role of the garbage collector?', tips: ['Explain heap vs stack briefly', 'Mention generational garbage collection at a high level', "Discuss what can cause a memory leak even with GC"] },
        { question: "What's the difference between an abstract class and an interface in Java, and when would you choose one over the other?", tips: ['Discuss multiple inheritance implications', 'Mention default methods in interfaces (Java 8+)', 'Give a real design scenario for each'] },
        { question: 'How does a HashMap work internally in Java, and what happens when two keys hash to the same bucket?', tips: ['Explain hashing and buckets at a high level', 'Discuss collision handling (chaining/treeification)', 'Mention time complexity of get/put on average vs worst case'] },
        { question: "What's the difference between checked and unchecked exceptions in Java, and how would you decide which to use when designing an API?", tips: ['Define each with a concrete example', 'Discuss the trade-off between forcing callers to handle errors vs flexibility', 'Mention how this affects method signatures'] },
        { question: "How does Java's synchronized keyword work, and what specific problem does it actually solve?", tips: ['Explain the concept of a monitor/lock', 'Give an example of a race condition it prevents', 'Mention the performance cost of synchronization'] },
    ]),

    'data scientist': buildBank([
        { question: "What's the difference between supervised and unsupervised learning, and can you give an example of each?", tips: ['Define each clearly with labeled vs unlabeled data', 'Give one concrete real-world example per type', 'Mention a common algorithm for each'] },
        { question: 'How would you handle missing data in a dataset before training a model?', tips: ['Discuss dropping vs imputing', 'Mention different imputation strategies (mean, median, model-based)', 'Explain how you would decide which approach fits the situation'] },
        { question: "What's the difference between overfitting and underfitting, and how would you detect and address each?", tips: ['Describe the bias-variance trade-off', 'Mention cross-validation as a detection method', 'Give concrete fixes for each (regularization, more data, simpler model)'] },
        { question: 'How would you evaluate a classification model when the dataset is highly imbalanced?', tips: ["Explain why accuracy alone is misleading here", 'Mention precision, recall, F1-score, and ROC-AUC', 'Discuss resampling or class-weighting techniques'] },
        { question: "What's the difference between bagging and boosting as ensemble techniques?", tips: ['Explain how each combines multiple models', 'Give a concrete example algorithm for each (Random Forest vs XGBoost)', 'Discuss when you would reach for one over the other'] },
        { question: 'How would you decide which features to include in a model, and how would you detect multicollinearity?', tips: ['Mention correlation analysis and VIF as detection methods', 'Discuss feature importance techniques', 'Explain why multicollinearity is actually a problem for some models'] },
    ]),

    'devops engineer': buildBank([
        { question: "What's the difference between a Docker image and a container, and how do they relate to each other?", tips: ['Define each term precisely', 'Use an analogy if it helps (class vs instance)', 'Mention how layers work in an image'] },
        { question: 'How would you design a CI/CD pipeline for a web application from code commit to production deployment?', tips: ['Walk through each stage: build, test, deploy', 'Mention rollback strategy if a deployment fails', 'Discuss how you would handle secrets/environment config'] },
        { question: "What's the difference between horizontal and vertical scaling, and when would you choose each?", tips: ['Give a concrete example of each', 'Discuss cost and complexity trade-offs', 'Mention how this relates to stateless vs stateful services'] },
        { question: 'How would you troubleshoot a production service that suddenly has high latency?', tips: ['Describe a structured, methodical debugging approach', 'Mention what metrics/logs you would check first', 'Discuss how you would narrow down the cause (network, DB, app, infra)'] },
        { question: "What's the difference between a Kubernetes Deployment and a StatefulSet, and when would you use each?", tips: ['Discuss stateless vs stateful workload needs', 'Mention stable network identity/storage for StatefulSets', 'Give a concrete example of each use case'] },
        { question: 'How would you set up monitoring and alerting for a production service — what would you actually track?', tips: ['Mention the four golden signals (latency, traffic, errors, saturation) or similar', 'Discuss alert fatigue and how to avoid it', 'Give an example of a metric and its alert threshold'] },
    ]),

    'mobile developer': buildBank([
        { question: "What's the difference between Activity and Fragment lifecycles in Android, and why does that distinction matter?", tips: ['Walk through key lifecycle methods for each', 'Explain a real bug that lifecycle mismanagement can cause', 'Mention how configuration changes (e.g. rotation) affect this'] },
        { question: 'How would you optimize a mobile app that has a laggy, janky scrolling list?', tips: ['Mention view recycling (RecyclerView/list virtualization)', 'Discuss avoiding heavy work on the main/UI thread', 'Consider image loading and caching strategy'] },
        { question: "What's the difference between local storage options on mobile — like SharedPreferences and a local database — and when would you use each?", tips: ['Compare use cases: simple key-value vs structured/queryable data', 'Mention performance and data size considerations', 'Give a concrete example of each in a real app'] },
        { question: 'How would you handle an API call in a mobile app that might fail due to poor network connectivity?', tips: ['Discuss retry strategy with backoff', 'Mention offline-first patterns / local caching', 'Consider how you would communicate failure to the user'] },
        { question: "What's the difference between synchronous and asynchronous image loading in a mobile app, and why does it matter for performance?", tips: ['Discuss blocking the main thread as the core problem', 'Mention image caching libraries/strategies', 'Give an example of a bad vs good user experience here'] },
        { question: 'How would you handle app state when the OS kills your app in the background and the user reopens it?', tips: ['Discuss saved instance state / process death handling', 'Mention what should and should not be persisted', 'Give a concrete example (e.g. a half-filled form)'] },
    ]),
};

// Fallback for any role not explicitly covered above — kept genuinely useful
// (real CS-fundamentals + a role-agnostic system question) rather than vague.
const GENERIC_BANK = buildBank([
    { question: "What's the difference between a process and a thread, and why does that distinction matter for how software is built?", tips: ['Define each clearly', 'Discuss memory sharing differences', 'Give an example of when you would use multiple threads vs multiple processes'] },
    { question: 'How would you approach debugging a piece of code that works on your machine but fails in production?', tips: ['Describe a structured, methodical approach', 'Mention environment differences to check first', 'Discuss how you would reproduce the issue safely'] },
    { question: "What's the difference between REST and GraphQL as API styles, and what are the trade-offs of each?", tips: ['Give a concrete example of a request in each style', 'Discuss over-fetching/under-fetching', 'Mention when one is clearly a better fit than the other'] },
    { question: 'How do you approach learning a new codebase when you join a project that already has a lot of existing code?', tips: ['Describe your actual process, not just "read the docs"', 'Mention how you validate your understanding', 'Discuss how you avoid breaking things while still learning'] },
    { question: "What's the difference between unit tests and integration tests, and how would you decide what to cover with each?", tips: ['Define each with a concrete example', 'Discuss the trade-off between speed and confidence', 'Mention where you would draw the line in a real project'] },
    { question: "How would you approach optimizing a piece of code that's technically correct but too slow?", tips: ['Mention profiling before optimizing (avoid guessing)', 'Discuss algorithmic complexity vs micro-optimizations', 'Give an example of a real bottleneck you would look for'] },
]);

/**
 * Returns a full static 16-question plan for the given job role. Matches
 * loosely on the role string (case-insensitive substring match) so
 * "Senior Full Stack Developer" or "Full-Stack Engineer" still resolve
 * sensibly rather than always falling to the generic bank.
 */
export function getQuestionBankForRole(jobRole) {
    const normalized = (jobRole || '').toLowerCase();

    const matchers = [
        { keys: ['full stack', 'fullstack', 'full-stack'], bank: 'full stack developer' },
        { keys: ['backend', 'back-end', 'back end'], bank: 'backend developer' },
        { keys: ['frontend', 'front-end', 'front end'], bank: 'frontend developer' },
        { keys: ['python'], bank: 'python developer' },
        { keys: ['java developer', 'java engineer', ' java '], bank: 'java developer' },
        { keys: ['data scientist', 'machine learning', 'ml engineer', 'data science'], bank: 'data scientist' },
        { keys: ['devops', 'site reliability', 'sre', 'platform engineer', 'cloud architect', 'cloud engineer'], bank: 'devops engineer' },
        { keys: ['mobile', 'android', 'ios developer'], bank: 'mobile developer' },
    ];

    for (const { keys, bank } of matchers) {
        if (keys.some(k => normalized.includes(k))) {
            return ROLE_BANKS[bank];
        }
    }

    // Bare "java" without surrounding spaces (e.g. at string start/end)
    if (normalized.includes('java') && !normalized.includes('javascript')) {
        return ROLE_BANKS['java developer'];
    }

    return GENERIC_BANK;
}
