import { createChatHandler } from '../server/chat.js';

const chatHandler = createChatHandler(process.env);

export default function handler(req, res) {
  return chatHandler(req, res);
}
