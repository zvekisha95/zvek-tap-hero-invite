let log = global.log || [];
global.log = log;

export default function handler(req, res) {
  res.status(200).json(log);
}
