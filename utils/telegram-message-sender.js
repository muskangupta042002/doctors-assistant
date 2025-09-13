import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();


const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

// To get chat id, send a message to your bot and visit:
// https://api.telegram.org/bot<YourBOTToken>/getUpdates
// Look for "chat":{"id":<YourChatID>,...}

/**
 * Sends a message to a Telegram chat.
 * @param {string} message - The message to send.
 * @param {string} [chatId] - The chat ID to send the message to. Defaults to process.env.CHAT_ID.
 * @returns {Promise<object>} The response from Telegram API.
 */
export default async function sendMessage(message, chatId = process.env.CHAT_ID) {
  if (!TELEGRAM_TOKEN) throw new Error("TELEGRAM_TOKEN is not set in environment variables.");
  if (!chatId) throw new Error("CHAT_ID is not set or provided.");
  if (!message) throw new Error("Message is required.");

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message })
  });

  const data = await response.json();
  return data;
}

