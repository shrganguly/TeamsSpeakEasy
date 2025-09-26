# Teams Voice Message Extension 🎤

A Microsoft Teams message extension that allows users to record voice messages, automatically transcribe them using AI, and get professional, concise summaries that can be inserted directly into chat conversations.

## 🚨 **IMPORTANT: Read Prerequisites First!**

**Before starting, you MUST complete the prerequisites checklist:**
👉 **[PREREQUISITES_CHECKLIST.md](PREREQUISITES_CHECKLIST.md)** 👈

**Key requirements you need BEFORE building:**
- ✅ Azure Bot Framework registration (mandatory)
- ✅ Public HTTPS hosting
- ✅ Microsoft App ID and Password
- ✅ Teams admin permissions

**Without these, your app will not work. No exceptions.**

---

## Features ✨

- 🎙️ **Voice Recording**: One-click voice recording with visual feedback
- 🤖 **AI Transcription**: Automatic speech-to-text using OpenAI Whisper
- ✍️ **Professional Summarization**: AI-powered message refinement for business communication
- 📝 **Editable Results**: Review and edit the generated message before sending
- 🔄 **Seamless Integration**: Direct insertion into Teams chat compose box
- 📱 **Works Everywhere**: Compatible with group chats, 1:1 chats, and channel conversations

## Quick Start 🚀

### Prerequisites
- Node.js 16+ installed
- Microsoft Teams (desktop or web)
- OpenAI API Key (optional, but recommended for best results)

### 1. Setup
```bash
# Install dependencies
npm install

# Copy environment template
copy .env.example .env

# Edit .env file and add your OpenAI API Key
notepad .env
```

### 2. Run Locally
```bash
# Start the development server
npm run dev
```
Server will be available at `http://localhost:3000`

### 3. Deploy and Package for Teams

#### Option A: Quick Local Testing
```bash
# Create Teams app package
npm run create-package -- -AppId "your-app-id" -BaseUrl "https://your-deployed-url.com"
```

#### Option B: Deploy to Azure (Recommended)
```bash
# Deploy to Azure and create package
npm run deploy
```

### 4. Install in Teams
1. Go to Microsoft Teams
2. Click "Apps" in the left sidebar
3. Click "Upload a custom app" → "Upload for [your organization]"
4. Select the generated `.zip` file from the project directory
5. Add the app to any chat or channel

## Usage 📱

1. **Open any Teams chat** (group chat, 1:1, or channel)
2. **Click the message extension icon** (🎤 Voice Message Pro) in the compose area
3. **Click the microphone button** to start recording
4. **Speak your message** naturally
5. **Click stop** when finished
6. **Review the AI-generated summary** 
7. **Edit if needed** and click "Insert to Chat"
8. **Send the message** as normal in Teams

## Configuration ⚙️

### Environment Variables (.env)
```bash
# Required for AI transcription and summarization
OPENAI_API_KEY=your_openai_api_key_here

# Server configuration
PORT=3000

# Teams app configuration (auto-filled by scripts)
TEAMS_APP_ID=auto-generated
TEAMS_APP_BASE_URL=your-deployment-url
TEAMS_APP_DOMAIN=your-domain
```

### Getting OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up/log in to your account
3. Navigate to "API Keys" section
4. Create a new secret key
5. Copy and paste it into your `.env` file

> **Note**: Without an OpenAI API key, the app will use mock transcription data for testing.

## Deployment Options 🌐

### Local Development
- Run `npm run dev` for development with hot reload
- Access at `http://localhost:3000`
- Use ngrok or similar for Teams testing: `ngrok http 3000`

### Azure App Service (Recommended)
- Use the included `deploy.ps1` script
- Automatically configures HTTPS and domain
- Suitable for team/organization use

### Other Cloud Providers
- Deploy to any Node.js hosting service
- Ensure HTTPS is enabled (required by Teams)
- Update the `TEAMS_APP_BASE_URL` in your `.env`

## File Structure 📁

```
TeamsVoiceExtension/
├── src/
│   └── server.js              # Main Express server
├── public/
│   ├── index.html            # Landing page
│   └── voice-recorder.html   # Voice recording interface
├── appPackage/
│   ├── manifest.json         # Teams app manifest
│   ├── color.png            # App icon (color)
│   └── outline.png          # App icon (outline)
├── scripts/
│   ├── create-teams-package.ps1  # Package creation script
│   └── deploy.ps1               # Deployment script
└── package.json             # Node.js dependencies
```

## API Endpoints 🔌

- `GET /` - Landing page
- `GET /voice-recorder` - Voice recording interface
- `POST /api/process-voice` - Process uploaded audio
- `GET /privacy` - Privacy policy (required by Teams)
- `GET /terms` - Terms of use (required by Teams)

## Troubleshooting 🔧

### Common Issues

**"Microphone access denied"**
- Ensure your browser allows microphone access
- Check Teams app permissions

**"AI processing failed"**
- Verify your OpenAI API key is correct
- Check your internet connection
- App falls back to mock data if AI fails

**"Can't insert to chat"**
- Try copying the message and pasting manually
- Close and reopen the voice recorder
- Ensure you're using a supported Teams version

**"App not loading in Teams"**
- Verify your deployment URL is HTTPS
- Check that the server is accessible
- Validate the Teams manifest

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` in your `.env` file.

## Security & Privacy 🔒

- Audio recordings are processed temporarily and not stored
- Transcription happens via OpenAI API (see their privacy policy)
- App designed for internal/organization use only
- No data persistence beyond the current session

## Contributing 🤝

This is an internal tool for your organization. Feel free to:
- Customize the AI prompts in `src/server.js`
- Modify the UI in `public/voice-recorder.html`
- Add additional features or integrations

## License 📄

MIT License - Internal use only

## Support 💬

For internal support and questions, contact your IT team or the development team.

---

**Happy voice messaging! 🎤✨**
- ** Privacy First**: Audio processed temporarily, not stored permanently
- ** Task Module Overlay**: All interaction happens in a modal overlay on top of the chat

##  Quick Start

### Prerequisites
- Node.js (v16 or higher)
- ngrok account and authtoken
- Microsoft Teams (web or desktop)

### Installation

1. **Clone/Download this project**
   ```powershell
   cd C:\Users\YourName\Projects
   # Extract or clone the project here
   ```

2. **Install dependencies**
   ```powershell
   cd TeamsVoiceExtension
   npm install
   ```

3. **Set up ngrok**
   - Download from https://ngrok.com/download
   - Extract and add to PATH
   - Get authtoken from ngrok dashboard
   - Run: `ngrok config add-authtoken YOUR_TOKEN`

4. **Deploy the application**
   ```powershell
   .\deploy.ps1
   ```

5. **Create Teams package**
   ```powershell
   .\create-teams-package.ps1
   ```

6. **Upload to Teams**
   - Open Microsoft Teams
   - Go to Apps  Upload a custom app
   - Select the generated ZIP file
   - Install for your organization

##  Usage

### In Teams:
1. Open any chat (1:1, group, or channel)
2. Look for the ** Voice Message** button in the compose area
3. Click the button to open the voice recorder overlay
4. Record your message by clicking the microphone
5. Review the AI-generated summary
6. Edit if needed and click "Insert to Chat"
7. The text appears in your compose box - just hit Enter to send!

### Features of the Voice Recorder:
- **Visual feedback**: Animated waveforms during recording
- **Professional UI**: Beautiful gradient design with smooth animations
- **Smart summarization**: AI converts casual speech to professional text
- **Edit capability**: Modify the summary before inserting
- **Multiple fallbacks**: Works even if AI is unavailable

##  Configuration

### OpenAI Integration (Optional)
To enable AI summarization, add your OpenAI API key to `.env`:

```
OPENAI_API_KEY=your-openai-api-key-here
```

Without OpenAI, the app uses basic text processing for summarization.

### Environment Variables
The following variables are auto-configured during deployment:

```
PORT=3000
TEAMS_APP_ID=your-generated-app-id
TEAMS_APP_BASE_URL=https://your-ngrok-url.ngrok-free.app
TEAMS_APP_DOMAIN=your-ngrok-url.ngrok-free.app
```

##  Development

### Running Locally
```powershell
npm start
```
Access at: http://localhost:3000

### Testing Voice Recorder
Visit: http://localhost:3000/voice-recorder

### Development Mode
```powershell
npm run dev
```
Uses nodemon for auto-restart on file changes.

##  Project Structure

```
TeamsVoiceExtension/
 src/
    server.js              # Express server with API endpoints
 public/
    index.html             # Landing page
    voice-recorder.html    # Voice recording task module
 appPackage/
    manifest.json          # Teams app manifest
    color.png              # App icon (96x96)
    outline.png            # App outline icon (32x32)
 package.json               # Node.js dependencies
 .env                       # Environment configuration
 deploy.ps1                 # Deployment script
 create-teams-package.ps1   # Package creation script
 README.md                  # This file
```

##  API Endpoints

- `GET /` - Landing page
- `GET /voice-recorder` - Voice recording task module
- `POST /api/process-voice` - Voice processing and summarization
- `GET /privacy` - Privacy policy (required for Teams)
- `GET /terms` - Terms of use (required for Teams)

##  Privacy & Security

- Audio recordings are processed in memory only
- No permanent storage of voice data
- AI processing via secure OpenAI API calls
- Designed for internal organizational use
- All data stays within your organization's control

##  Deployment Options

### Option 1: ngrok (Development/Testing)
- Use the provided `deploy.ps1` script
- Perfect for internal testing and development
- Easy to set up and tear down

### Option 2: Cloud Hosting (Production)
- Deploy to Azure App Service, Heroku, or similar
- Update `TEAMS_APP_BASE_URL` in manifest
- Requires HTTPS endpoint

##  Customization

### Changing the UI
Edit `public/voice-recorder.html` to modify:
- Colors and styling
- Button behavior
- Text and messaging

### Modifying AI Prompts
Update the system prompt in `src/server.js`:
```javascript
const systemPrompt = "Your custom prompt here...";
```

### Adding Features
The modular structure makes it easy to add:
- Different AI providers
- Additional processing options
- Custom audio formats
- Integration with other services

##  Internal Sharing

This app is designed for internal use. To share with colleagues:

1. **Share the ZIP file**: Send the generated Teams app package
2. **Share deployment instructions**: Include this README
3. **Set up shared hosting**: Consider a permanent cloud deployment
4. **Centralized API keys**: Set up shared OpenAI API access

##  Support

For internal support:
- Check the troubleshooting section below
- Review ngrok logs at http://127.0.0.1:4040
- Check browser console for JavaScript errors
- Verify Teams app manifest in Teams Developer Portal

##  Troubleshooting

### Common Issues:

** "Bot based compose extension must have GUID botId"**
- This is expected - the app requires a bot ID for compose extensions
- The bot ID is auto-generated in the package creation script

** Voice recording not working**
- Check microphone permissions in browser
- Ensure HTTPS (ngrok provides this)
- Try in different browser

** AI summarization failing**
- Check if OpenAI API key is set correctly
- Verify API key has sufficient credits
- App will fall back to basic summarization

** Can't install Teams app**
- Ensure your organization allows custom app uploads
- Check if app manifest is valid
- Verify all required files are in the package

** ngrok tunnel stopped**
- Restart with `.\deploy.ps1`
- Check ngrok account for session limits
- Update Teams app with new ngrok URL

##  License

MIT License - Internal use only
