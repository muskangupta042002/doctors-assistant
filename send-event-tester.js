import fetch from 'node-fetch';
import sendMessage from './utils/telegram-message-sender.js';

async function createEventWithFetch() {
  const url = 'http://localhost:3000/create-event';
  const data = {
    summary: 'Configurable Team Meeting',
    description: 'A meeting with all the details passed via a request body.',
    start: '2025-09-18T14:00:00+05:30',
    end: '2025-09-18T15:00:00+05:30',
    timeZone: 'Asia/Kolkata',
    attendees: ['muskangupta072000@gmail.com'],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log('Response from fetch:', result);
  } catch (error) {
    console.error('Error creating event with fetch:', error);
  }
}

async function testSendMessage() {
  try {
    const response = await sendMessage('Test message from send-event-tester.js', '1160662416');  
    console.log('Response from Telegram API:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

createEventWithFetch();
testSendMessage();