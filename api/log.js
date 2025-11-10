// /api/log.js

export default function handler() {
  globalThis.inviteLog = globalThis.inviteLog || [];

  return new Response(
    JSON.stringify(globalThis.inviteLog, null, 2),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
