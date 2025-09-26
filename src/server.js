const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { CloudAdapter, ConfigurationServiceClientCredentialFactory, createBotFrameworkAuthenticationFromConfiguration } = require('botbuilder');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Bot Framework setup
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MICROSOFT_APP_ID,
    MicrosoftAppPassword: process.env.MICROSOFT_APP_PASSWORD,
    MicrosoftAppType: process.env.MICROSOFT_APP_TYPE || 'MultiTenant',
    MicrosoftAppTenantId: process.env.MICROSOFT_APP_TENANT_ID
});

const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Error handler for bot framework
adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    console.error(error);
    await context.sendActivity('The bot encountered an error or bug.');
};

// Simple bot logic for handling task module submissions
const bot = {
    async run(context) {
        // Handle task module submissions and other bot activities
        console.log('=== BOT ACTIVITY DEBUG ===');
        console.log('Activity type:', context.activity.type);
        console.log('Activity name:', context.activity.name);
        console.log('Full activity:', JSON.stringify(context.activity, null, 2));
        
        if (context.activity.type === 'invoke') {
            if (context.activity.name === 'composeExtension/fetchTask') {
                console.log('=== FETCH TASK HANDLER ===');
                // Return task module configuration
                return {
                    status: 200,
                    body: {
                        task: {
                            type: 'continue',
                            value: {
                                title: "🎤 Speak Easy - Record Voice Message",
                                height: "large", 
                                width: "large",
                                url: "https://teamsspeakeasy.onrender.com/voice-recorder"
                            }
                        }
                    }
                };
            }
            
            if (context.activity.name === 'task/submit') {
                console.log('=== TASK SUBMIT HANDLER ===');
                const submittedData = context.activity.value || {};
                const message = submittedData.message || submittedData;
                
                console.log('Submitted data:', JSON.stringify(submittedData, null, 2));
                console.log('Extracted message:', message);
                
                // Try different response formats for compose extensions
                const responses = [
                    // Format 1: Simple text response
                    {
                        status: 200,
                        body: typeof message === 'string' ? message : message.toString()
                    },
                    // Format 2: Compose extension with text/plain
                    {
                        status: 200,
                        body: {
                            composeExtension: {
                                type: 'result',
                                attachmentLayout: 'list',
                                attachments: [{
                                    contentType: 'text/plain',
                                    content: typeof message === 'string' ? message : message.toString()
                                }]
                            }
                        }
                    }
                ];
                
                // Use the second format (compose extension)
                console.log('Returning response:', JSON.stringify(responses[1], null, 2));
                return responses[1];
            }
        }
        
        // Default response for other activities
        if (context.activity.type === 'message') {
            await context.sendActivity('Voice Message Extension is ready! Use the compose extension to record voice messages.');
        }
    }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Bot Framework endpoint - REQUIRED for Teams
app.post('/api/messages', async (req, res) => {
    await adapter.process(req, res, (context) => bot.run(context));
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Test endpoint for Azure OpenAI integration
app.post('/test-ai', express.json(), async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        console.log('Testing Azure OpenAI with text:', text);
        
        // Test the processWithAI function
        const result = await processWithAI(text);
        
        res.json({ 
            success: true, 
            original: text,
            processed: result 
        });
    } catch (error) {
        console.error('Test AI error:', error);
        res.status(500).json({ 
            error: 'AI processing failed', 
            message: error.message 
        });
    }
});

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Voice recording task module
app.get('/voice-recorder', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/voice-recorder.html'));
});

// Handle task module result submission
app.post('/api/task-submit', express.json(), (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'No message provided'
            });
        }

        // For compose extensions, return the text directly to be inserted
        res.json({
            composeExtension: {
                type: "result", 
                attachmentLayout: "list",
                attachments: [{
                    contentType: "text/plain",
                    content: message.trim()
                }]
            }
        });
        
    } catch (error) {
        console.error('Error handling task submission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit task'
        });
    }
});

// API endpoint for processing voice recordings
app.post('/api/process-voice', upload.single('audio'), async (req, res) => {
    try {
        console.log('Received voice processing request');
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No audio file provided'
            });
        }

        let transcription;
        
        // Try to use Azure OpenAI or OpenAI for transcription if configured
        if ((process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) || process.env.OPENAI_API_KEY) {
            try {
                transcription = await transcribeWithWhisper(req.file.buffer);
                console.log('Transcription successful:', transcription.substring(0, 100) + '...');
            } catch (whisperError) {
                console.log('Whisper transcription failed, using mock data:', whisperError.message);
                transcription = generateMockTranscription();
            }
        } else {
            console.log('No OpenAI configuration found, using mock transcription');
            transcription = generateMockTranscription();
        }
        
        // Generate professional summary
        const summary = await processWithAI(transcription);
        
        res.json({
            success: true,
            originalText: transcription,
            summary: summary,
            wordCount: transcription.split(' ').length
        });
        
    } catch (error) {
        console.error('Error processing voice:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process voice recording'
        });
    }
});

// Function to transcribe audio using OpenAI Whisper (Azure or Direct API)
async function transcribeWithWhisper(audioBuffer) {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    let openai;
    
    // Check if Azure OpenAI is configured first (recommended)
    if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
        const { OpenAI } = require('openai');
        
        openai = new OpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/whisper`,
            defaultQuery: { 'api-version': '2024-02-01' },
            defaultHeaders: {
                'api-key': process.env.AZURE_OPENAI_API_KEY,
            },
        });
        console.log('Using Azure OpenAI Service');
    } else if (process.env.OPENAI_API_KEY) {
        const { OpenAI } = require('openai');
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        console.log('Using direct OpenAI API');
    } else {
        throw new Error('No OpenAI configuration found');
    }

    // Create temporary file
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `voice_${Date.now()}.webm`);
    
    try {
        // Write buffer to temporary file
        fs.writeFileSync(tempFile, audioBuffer);
        
        // Transcribe using Whisper
        // For Azure OpenAI with deployment-specific baseURL, use the deployment name as model
        const modelName = process.env.AZURE_OPENAI_WHISPER_DEPLOYMENT || 'whisper-1';
        
        const response = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFile),
            model: modelName,
            language: 'en',
            response_format: 'text'
        });
        
        // Clean up temporary file
        fs.unlinkSync(tempFile);
        
        return response;
    } catch (error) {
        // Clean up temporary file on error
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
        throw error;
    }
}

// Generate mock transcription for testing
function generateMockTranscription() {
    // When OpenAI API is not available, show helpful message
    return `[DEMO MODE - OpenAI API quota exceeded] 
    
Your voice was recorded successfully! 

To get real AI transcription:
1. Add credits to your OpenAI account at https://platform.openai.com/billing
2. Or get a new API key at https://platform.openai.com/api-keys

Your actual recording would be transcribed and summarized here.`;
}

// AI summarization function
async function processWithAI(text) {
    try {
        let openai;
        
        // Check if Azure OpenAI is configured first (recommended)
        if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
            const { OpenAI } = require('openai');
            openai = new OpenAI({
                apiKey: process.env.AZURE_OPENAI_API_KEY,
                baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
                defaultQuery: { 'api-version': '2024-02-01' },
                defaultHeaders: {
                    'api-key': process.env.AZURE_OPENAI_API_KEY,
                },
            });
            console.log('Using Azure OpenAI for summarization');
        } else if (process.env.OPENAI_API_KEY) {
            const { OpenAI } = require('openai');
            openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            console.log('Using direct OpenAI API for summarization');
        } else {
            throw new Error('No OpenAI configuration found');
        }

        // Use deployment name for Azure OpenAI, model name for direct OpenAI
        const modelOrDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-3.5-turbo";

        const completion = await openai.chat.completions.create({
            model: modelOrDeployment,
            messages: [
                {
                    role: "system",
                    content: `You are a friendly communication assistant that converts voice messages into warm, conversational Teams chat messages. Make them sound natural and friendly - like how people actually talk in 1:1 and group chats.

ADAPTIVE LENGTH GUIDELINES:
- SHORT dictations (1-2 sentences): Keep output 1-2 sentences max
- MEDIUM dictations (3-5 sentences): Allow 2-4 sentences in output  
- LONG dictations (6+ sentences): Allow 3-6 sentences, capture key points proportionally
- Always use warm, friendly tone with "Hey", "Hi", or casual starters
- AGGRESSIVELY REMOVE FILLER WORDS: "you know", "like", "um", "uh", "actually", "basically", "I mean", "sort of", "kind of", "I guess", "the thing is", "what I wanted to say"
- PRESERVE meaningful phrases like "I think" and "I believe" (unless used repetitively)
- Remove excessive "so" at sentence starts but keep meaningful "so" (like "so we can...")
- Clean up repetitive phrases and false starts
- Sound conversational, not commanding or formal
- Add friendly touches like "thanks!" or "let me know!"

Examples:

SHORT INPUT:
Input: "Thanks everyone for your help on this, really appreciate it!"
Output: "Thanks everyone for all your help - really appreciate it! 🙏"

Input: "Let's connect tomorrow at 3 PM to review the draft."
Output: "Hey! Let's connect tomorrow at 3 PM to review the draft. Sound good?"

MEDIUM INPUT:
Input: "Hey, so just wanted to say sorry I'll be late for the meeting, I got caught up in traffic, might be like 15 mins late, hope that's okay."
Output: "Hey everyone! Running about 15 mins late due to traffic - thanks for your patience!"

Input: "Uh can you please share that doc with me again? I can't find it anywhere. I thought I saved it but now I'm not sure where it went."
Output: "Hey, could you share that doc again? Can't seem to find it anywhere - thought I saved it but not sure where it went. Thanks!"

Input: "I think we should go with option A, you know, because it has better ROI and, like, I believe it's the right choice for our team."
Output: "Hey! I think we should go with option A - better ROI and I believe it's the right choice for our team."

FILLER WORD REMOVAL EXAMPLE:
Input: "So the thing is, what I told, what we actually discussed in the MVP Insider session call, that it's majorly two themes of feedback. The first theme being, you know, having support of Excel, and the second is, you know, having a way to change, have a two-way sync sort of thing with documents. So yeah, these are the two key themes of feedback and we'll work on it."
Output: "Hey! Two key themes from the MVP session: Excel support and two-way document sync. We'll tackle both of these!"

LONG INPUT:
Input: "Um, I mean, like I wanted to follow up on our discussion yesterday about the Q4 roadmap, you know? We talked about three main priorities: first, improving the user onboarding experience which Sarah's team is leading. Second, we need to focus on performance optimizations especially around the dashboard loading times. And third, we discussed adding those new reporting features that the sales team has been requesting."
Output: "Hey team! Following up on yesterday's Q4 roadmap discussion. Three main priorities: user onboarding (Sarah's leading), dashboard performance optimizations, and new sales reporting features. Thoughts?"

Input: "I wanted to follow up on our discussion yesterday about the Q4 roadmap. We talked about three main priorities: first, improving the user onboarding experience which Sarah's team is leading. Second, we need to focus on performance optimizations especially around the dashboard loading times. And third, we discussed adding those new reporting features that the sales team has been requesting. I think we should prioritize the performance work first since it affects all users, then move to onboarding improvements, and finally tackle the reporting features. What do you all think about this approach?"
Output: "Hey team! Following up on yesterday's Q4 roadmap discussion. Three main priorities: user onboarding (Sarah's leading), dashboard performance optimizations, and new sales reporting features. I'm thinking we prioritize performance first since it affects everyone, then onboarding, then reporting. Thoughts on this approach?"`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            max_completion_tokens: 150,
            temperature: 0.8,
        });

        // Extract the response content
        const responseContent = completion.choices[0]?.message?.content?.trim();
        return responseContent || text;
    } catch (error) {
        console.error('AI processing error:', error);
        // Fallback: Simple summarization
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length <= 2) {
            return text.trim();
        } else {
            return sentences.slice(0, 2).join('. ') + '.';
        }
    }
}

// Privacy and Terms pages (required for Teams manifest)
app.get('/privacy', (req, res) => {
    res.send(`
        <html>
        <head><title>Privacy Policy</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <h1>Privacy Policy</h1>
            <p>This Voice Message Extension processes audio recordings temporarily for transcription and summarization.</p>
            <p>Voice recordings are not stored permanently and are processed securely.</p>
            <p>This app is for internal use only and does not share data with external services beyond AI processing.</p>
        </body>
        </html>
    `);
});

app.get('/terms', (req, res) => {
    res.send(`
        <html>
        <head><title>Terms of Use</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <h1>Terms of Use</h1>
            <p>This application is provided for internal use for voice message transcription and summarization.</p>
            <p>Users are responsible for the content they record and process.</p>
            <p>The app requires microphone access for voice recording functionality.</p>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(` Teams Voice Extension Server running on port ${PORT}`);
    console.log(` Access at: http://localhost:${PORT}`);
    console.log(` Voice Recorder: http://localhost:${PORT}/voice-recorder`);
});

module.exports = app;
