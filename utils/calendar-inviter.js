// calendar-inviter.js
import express from 'express';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// These lines are needed to resolve __dirname and __filename in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Load credentials
const credentialsPath = path.join(__dirname, 'credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const { client_secret, client_id, redirect_uris } = credentials.web;

// Set up the OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Function to save tokens to a file
function saveTokens(tokens) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('Tokens saved to file.');
}

// Step 1: Generate the authentication URL
app.get('/auth', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', 
    scope: SCOPES,
    prompt: 'consent',
  });
  res.redirect(authUrl);
});

// Step 2: Handle the redirect and get tokens
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    saveTokens(tokens); // Save tokens for persistence
    res.send('Successfully authenticated! You can now send a POST request to /create-event.');
  } catch (error) {
    console.error('Error retrieving access token:', error);
    res.status(500).send('Authentication failed.');
  }
});

// Step 3: Create an event with configurable data
app.post('/create-event', async (req, res) => {
  let tokens;
  try {
    tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(tokens);
  } catch (err) {
    return res.status(401).send('Please authenticate first by visiting the /auth URL.');
  }

  // Use refresh token to get a new access token if necessary
  if (oAuth2Client.isTokenExpiring()) {
    try {
      const { credentials } = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(credentials);
      saveTokens(credentials);
      console.log('Access token refreshed.');
    } catch (error) {
      console.error('Error refreshing access token:', error.message);
      return res.status(401).send('Failed to refresh access token. Please re-authenticate.');
    }
  }

  const { summary, description, start, end, attendees, timeZone } = req.body;

  // Basic validation
  if (!summary || !start || !end) {
    return res.status(400).send('Missing required fields: summary, start, and end.');
  }
  
  const event = {
    summary,
    description: description || '',
    start: {
      dateTime: start,
      timeZone: timeZone || 'UTC',
    },
    end: {
      dateTime: end,
      timeZone: timeZone || 'UTC',
    },
    attendees: (attendees || []).map(email => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
    conferenceData: {
      createRequest: {
        requestId: `meet-meeting-${Date.now()}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet'
        }
      }
    }
  };

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all',
      conferenceDataVersion: 1
    });

    res.status(200).json({
      message: 'Event created successfully!',
      eventUrl: response.data.htmlLink
    });
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(500).send('Error creating event.');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('1. Visit http://localhost:3000/auth to authenticate with Google.');
});