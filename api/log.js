// /api/log.js
export default function handler(req, res) {
  global.inviteLog = global.inviteLog || [];
  return res.status(200).json(global.inviteLog);
}

