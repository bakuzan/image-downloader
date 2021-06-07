export function log(...messages: any[]) {
  console.log(...messages);
}

export function reportError(...messages: any[]) {
  console.error('ERROR: ', ...messages);
}
