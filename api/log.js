export default () => {
  return new Response(
    JSON.stringify(globalThis.inviteLog || []),
    { status: 200 }
  );
};
