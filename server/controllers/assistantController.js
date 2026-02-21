const { GoogleGenerativeAI } = require('@google/generative-ai');
const Course = require('../models/Course');

// Initialize Gemini API
const getGenAI = () => {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY is missing in environment variables');
        return null; // Handle missing key gracefully in development
    }
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

exports.chatWithAssistant = async (req, res) => {
    try {
        const genAI = getGenAI();
        if (!genAI) {
            return res.status(503).json({ reply: 'AI Assistant is currently unavailable due to missing API configuration.' });
        }

        const { courseId, lessonId, message } = req.body;

        if (!message) {
            return res.status(400).json({ msg: 'Message is required' });
        }

        // Fetch course details for context
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        const lesson = course.lessons.id(lessonId);
        const lessonTitle = lesson ? lesson.title : 'General Course Q&A';

        // Prepare context
        const context = `
Course Title: ${course.title}
Course Category: ${course.category}
Course Description: ${course.description}
Current Lesson: ${lessonTitle}
`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are the "RuralEdu Course Assistant", a specialized AI tutor designed to help students understand specific course materials.

### CONTEXT & KNOWLEDGE BOUNDARY
1. Your ONLY source of truth is the provided course context. 
2. If a student asks a question that is NOT covered in the provided course material, politely state: "I'm sorry, that topic isn't covered in this specific course module. Please stick to questions regarding ${course.title}."
3. Do NOT use your general pre-trained knowledge to answer questions about external topics (politics, celebrities, other academic subjects).

### TONE & BEHAVIOR
- Use simple, clear language suitable for rural students who may be learning English as a second language.
- If a concept is complex, use analogies related to rural life (farming, local community, nature) to explain it.
- Encourage the student to watch the accompanying video if they seem stuck.

### RESPONSE STRUCTURE
- Keep answers concise (under 150 words).
- Use bullet points for steps or lists.
- End every answer with a brief encouraging remark like "Keep going!" or "You're doing great!"

COURSE CONTEXT:
${context}`
        });

        const prompt = `Student message: ${message}\nAssistant response:`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        res.json({ reply: responseText });

    } catch (err) {
        console.error('Error in chatWithAssistant:', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};
