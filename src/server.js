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
            if (context.activity.name === 'task/fetch') {
                console.log('=== TASK FETCH HANDLER ===');
                console.log('Handling task/fetch for compose extension');
                
                // Return task module configuration
                const response = {
                    status: 200,
                    body: {
                        task: {
                            type: 'continue',
                            value: {
                                title: '🎤 Speak Easy - Record Voice Message',
                                height: 'large',
                                width: 'large',
                                url: 'https://teamsspeakeasy.onrender.com/voice-recorder'
                            }
                        }
                    }
                };
                
                console.log('Returning task fetch response:', JSON.stringify(response, null, 2));
                return response;
            }
            else if (context.activity.name === 'task/submit') {
                console.log('=== TASK SUBMIT HANDLER ===');
                const submittedData = context.activity.value || {};
                const message = submittedData.message || submittedData;
                
                console.log('Submitted data:', JSON.stringify(submittedData, null, 2));
                console.log('Extracted message:', message);
                
                // Return simple text response for task submission
                const response = {
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
                };
                
                console.log('Returning task submit response:', JSON.stringify(response, null, 2));
                return response;
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

// Simple Azure OpenAI test endpoint
app.get('/test-azure-simple', async (req, res) => {
    try {
        console.log('=== SIMPLE AZURE OPENAI TEST ===');
        const { OpenAI } = require('openai');
        
        const openai = new OpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
            defaultQuery: { 'api-version': '2024-02-01' },
            defaultHeaders: {
                'api-key': process.env.AZURE_OPENAI_API_KEY,
            },
        });
        
        const response = await openai.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
            messages: [{ role: 'user', content: 'Say hello world' }],
            max_completion_tokens: 10
        });
        
        res.json({
            success: true,
            response: response.choices[0]?.message?.content,
            fullResponse: response
        });
    } catch (error) {
        console.error('Simple Azure test error:', error);
        res.status(500).json({
            error: error.message,
            type: error.constructor.name,
            code: error.code
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
    const startTime = Date.now();
    console.log('=== AZURE OPENAI DEBUG ===');
    console.log('Input text:', text.substring(0, 100) + '...');
    console.log('Text length:', text.length);
    
    try {
        let openai;
        
        // Check if Azure OpenAI is configured first (recommended)
        if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
            console.log('Azure OpenAI Configuration:');
            console.log('- Endpoint:', process.env.AZURE_OPENAI_ENDPOINT);
            console.log('- Deployment:', process.env.AZURE_OPENAI_DEPLOYMENT_NAME);
            console.log('- API Key exists:', !!process.env.AZURE_OPENAI_API_KEY);
            console.log('- API Key length:', process.env.AZURE_OPENAI_API_KEY?.length || 0);
            
            const { OpenAI } = require('openai');
            const baseURL = `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`;
            console.log('- Full Base URL:', baseURL);
            
            openai = new OpenAI({
                apiKey: process.env.AZURE_OPENAI_API_KEY,
                baseURL: baseURL,
                defaultQuery: { 'api-version': '2024-02-01' },
                defaultHeaders: {
                    'api-key': process.env.AZURE_OPENAI_API_KEY,
                },
                timeout: 30000, // 30 second timeout
            });
            console.log('✅ Azure OpenAI client initialized');
        } else if (process.env.OPENAI_API_KEY) {
            const { OpenAI } = require('openai');
            openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
                timeout: 30000, // 30 second timeout
            });
            console.log('Using direct OpenAI API for summarization');
        } else {
            throw new Error('No OpenAI configuration found');
        }

        // Use deployment name for Azure OpenAI, model name for direct OpenAI
        const modelOrDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-3.5-turbo";
        console.log('Using model/deployment:', modelOrDeployment);

        console.log('🚀 Making API call to Azure OpenAI...');
        const completion = await Promise.race([
            openai.chat.completions.create({
                model: modelOrDeployment,
                messages: [
                {
                    role: "user",
                    content: `Please make this message more professional and concise for Teams chat. Remove filler words and keep it friendly: "${text}"`
                }
            ],
                max_completion_tokens: 500,
                temperature: 1,
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Azure OpenAI timeout after 25 seconds')), 25000)
            )
        ]);
        
        const elapsedTime = Date.now() - startTime;
        console.log('✅ Azure OpenAI API call completed in', elapsedTime, 'ms');
        console.log('Response choices count:', completion.choices?.length || 0);

        // Extract and validate the response content
        console.log('Full completion object:', JSON.stringify(completion, null, 2));
        
        const responseContent = completion.choices[0]?.message?.content?.trim();
        console.log('Raw response content:', JSON.stringify(responseContent));
        console.log('Response content preview:', responseContent?.substring(0, 200) || 'EMPTY');
        console.log('Response length:', responseContent?.length || 0);
        
        // If Azure OpenAI returns empty, try a simpler approach
        if (!responseContent || responseContent.length === 0) {
            console.log('⚠️ Empty response from Azure OpenAI, trying simple fallback');
            
            // Try a much simpler prompt
            const simpleCompletion = await openai.chat.completions.create({
                model: modelOrDeployment,
                messages: [
                    {
                        role: "system", 
                        content: "You are a helpful assistant. Make this text more professional and concise for a Teams chat message. Keep it friendly and conversational."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                max_completion_tokens: 100,
                temperature: 1
            });
            
            const simpleResponse = simpleCompletion.choices[0]?.message?.content?.trim();
            console.log('Simple fallback response:', simpleResponse);
            
            return simpleResponse || text;
        }
        
        return responseContent;
    } catch (error) {
        const elapsedTime = Date.now() - startTime;
        console.error('❌ AI processing error after', elapsedTime, 'ms:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.8'
    });
});

// Keep-alive function to prevent cold starts on Render free tier
function keepAlive() {
    const isProduction = process.env.NODE_ENV === 'production';
    const renderUrl = process.env.RENDER_EXTERNAL_URL || 'https://teamsspeakeasy.onrender.com';
    
    if (isProduction && renderUrl) {
        console.log('🔄 Starting keep-alive ping every 10 minutes to prevent cold starts');
        
        setInterval(async () => {
            try {
                const fetch = require('node-fetch');
                await fetch(`${renderUrl}/health`);
                console.log('🏓 Keep-alive ping sent');
            } catch (error) {
                console.log('⚠️ Keep-alive ping failed:', error.message);
            }
        }, 10 * 60 * 1000); // 10 minutes
    }
}

app.listen(PORT, () => {
    console.log(`🚀 Teams Voice Extension Server running on port ${PORT}`);
    console.log(`📍 Access at: http://localhost:${PORT}`);
    console.log(`🎤 Voice Recorder: http://localhost:${PORT}/voice-recorder`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    
    // Start keep-alive after a 2-minute delay (let service fully start)
    setTimeout(keepAlive, 2 * 60 * 1000);
});

module.exports = app;
