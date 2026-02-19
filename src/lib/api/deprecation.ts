const DEFAULT_SUNSET = 'Mon, 31 Aug 2026 00:00:00 GMT';

export function addDeprecationHeaders(response: Response, successorPath: string): Response {
  response.headers.set('Deprecation', 'true');
  response.headers.set('Sunset', DEFAULT_SUNSET);
  response.headers.set('Link', `<${successorPath}>; rel="successor-version"`);

  return response;
}
