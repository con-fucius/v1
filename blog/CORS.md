## CORS

CORS is a security feature enforced by browsers to restrict web pages
from making requests to a different origin (domain, protocol, port
combination) than the one that served the page, unless the target origin
explicitly permits it via specific HTTP headers.

### Mechanism

When a frontend at Origin A tries to request a resource from a server at
Origin B, the browser may first send an HTTP \'OPTIONS\' request
(preflight) to Origin B for non-\"simple\" requests.

Origin B must respond with appropriate CORS headers (e.g.,
\'Access-Control-Allow-Origin\', \'Access-Control-Allow-Methods\',
\'Access-Control-Allow-Headers\') indicating if Origin A is allowed to
make the intended request (matching the origin, method, and headers
requested in the preflight).

If the headers permit the request, the browser proceeds with the actual
request (e.g., \'GET\', \'POST\'). If not permitted, the browser blocks
the request and generates a CORS error in the console.

#### Context

In the Yokai staging/deployment stage, CORS errors in the development
environment, prevented browser requests from the development frontend to
the backend API.

## Same-Origin Policy Fundamentals

Same-Origin Policy (SOP) is a foundational security mechanism in
browsers that predates CORS. SOP restricts how documents or scripts from
one origin can interact with resources from another origin, protecting
sensitive user data like authentication tokens and personal information.

### Origin Components and Demonstrative Cases

Two resources share the same origin only when they have identical
protocol (HTTP/HTTPS), domain name and port number.

Illustratively:

- \'https://example.com:443/page1\' and
  \'https://example.com:443/page2\' are same-origin

- \'http://example.com/page1\' and \'https://example.com/page1\' are
  different origins due to protocol difference

- \'https://example.com\' and \'https://api.example.com\' are different
  origins due to subdomain difference

The Same-Origin Policy became limiting as applications grew more complex
and began relying heavily on third-party APIs.

## Need for Cross-Origin Communication

CORS allows servers to explicitly opt-in to cross-origin requests
through HTTP headers, providing controlled flexibility for modern web
applications. CORS operates through a set of HTTP headers that control
how browsers and servers interact across different origins.

### Key CORS Headers

- Access-Control-Allow-Origin: Specifies which origins can access the
  resource (specific origin or wildcard \'\*\')

- Access-Control-Allow-Methods: Lists permitted HTTP methods (GET, POST,
  OPTIONS, etc.)

- Access-Control-Allow-Headers: Specifies which headers can be used in
  the actual request

- Access-Control-Expose-Headers: Indicates which response headers can be
  exposed to the client

- Access-Control-Max-Age: Controls how long preflight request results
  can be cached

- Access-Control-Allow-Credentials: When set to \'true\', allows
  credentials (cookies, HTTP authentication) to be included in
  cross-origin requests

### Preflight Request Mechanism

For requests that could potentially be harmful, browsers send a
preliminary \"preflight\" request using the OPTIONS method before the
actual request:

1.  When preflight occurs:

Preflight is triggered for: non-simple HTTP methods (PUT, DELETE, etc.),
requests with custom headers and content types other than
application/x-www-form-urlencoded, multipart/form-data, or text/plain.

2.  Preflight request headers:

- \'Origin\': The requesting page\'s origin

- \'Access-Control-Request-Method\': The HTTP method of the actual
  request

- \'Access-Control-Request-Headers\': Custom headers used in the actual
  request

3.  Preflight response requirements:

- Must include appropriate Access-Control-Allow-\* headers that permit
  the actual request

- For credentialed requests, must specify the exact origin (not
  wildcard) and include Access-Control-Allow-Credentials: true

### Advanced CORS Scenarios

#### Dynamic CORS Headers

For production environments, it\'s often safer to dynamically set the
\'Access-Control-Allow-Origin\' header based on a whitelist.

#### Credentialed Requests:

When cookies or authentication are needed in cross-origin requests,
additional configuration is required:

- Server must set \'Access-Control-Allow-Credentials: true\'

- Server must specify exact origin in \'Access-Control-Allow-Origin\'
  (not wildcard)

- Client must set \'credentials: \'include\'\' in fetch options

### Load Balancer CORS Issues

#### Redirect-related CORS Failures

Load balancers that perform HTTP redirects can cause unique CORS
problems. When a load balancer redirects an \'OPTIONS\' preflight
request, browsers will reject it with errors like \"preflight is invalid
(redirect) or redirect is not allowed for a preflight request.\"

This occurs because:

- CORS specifications explicitly forbid redirects during preflight
  requests.

- When a load balancer redirects to a backend server (changing
  host/domain), the preflight mechanism views this as a security
  violation.

- The browser expects the load balancer itself to respond to the
  preflight request with appropriate CORS headers, not to redirect it.

#### Multi-Instance Inconsistency

With multiple backend instances behind a load balancer, CORS
configuration must be consistent across all instances.

If some instances have updated CORS configurations while others don\'t,
users will experience intermittent CORS failures depending on which
instance handles their request.

#### Common Solutions

To identify load balancer-related CORS issues:

- Test direct requests to backend instances (bypassing the load
  balancer) to verify CORS configuration consistency.

- Use \'curl\' to send preflight requests and inspect headers.

- Check for redirects in the load balancer\'s routing rules.

For load balancer CORS issues:

- Ensure load balancers handle \'OPTIONS\' requests directly with proper
  CORS headers rather than redirecting them.

- Use health checks to remove instances with outdated configurations
  from the load balancer\'s rotation.

- Implement caching strategies that respect the \'Vary: Origin\' header
  to prevent cached responses from being served to different origins.

- For GCP load balancers specifically, redirects must be configured
  carefully as they cannot directly inject CORS headers into redirect
  responses.

## CORS Debugging

### Browser Dev Tools

Both Chrome and Firefox offer network inspection tools to analyze CORS
issues, but they display them differently. In Chrome: Look for the
blocked preflight requests in the Network tab (ensure \"All\" requests
are visible, not just XHR). In Firefox: The Network tab will show the
preflight \'OPTIONS\' request below the actual request, with specific
error details in response headers.

### Testing with cURL

Use command-line tools to simulate preflight requests, which can help
identify server-side configuration issues:

### Common Error Patterns

- \'No \'Access-Control-Allow-Origin\' header present\': The server
  isn\'t returning the required CORS headers.

- \'Method not allowed by Access-Control-Allow-Methods\': The requested
  HTTP method isn\'t permitted by the server\'s CORS configuration.

- \'Request header field not allowed by Access-Control-Allow-Headers\':
  Custom headers being sent aren\'t included in the server\'s allowed
  headers list.

- \'Access-Control-Allow-Origin cannot be \'\*\' when credentials are
  included\': Sending credentials (cookies) requires a specific origin,
  not a wildcard.

### Preflight Debugging

When a preflight request fails, the browser doesn\'t show the actual
(blocked) request in developer tools. Instead:

- Check for 405 METHOD NOT ALLOWED responses to OPTIONS requests
  (indicates CORS is not configured).

- Examine if the preflight request receives a 204 NO CONTENT but without
  the necessary CORS headers (the server is ignoring the request).

- Look for redirects during preflight requests (which will always fail
  CORS checks).

### Deployment-Specific CORS Considerations

#### Environment-Specific Configuration

CORS settings must be environment-aware. Development environments
typically need to allow \'localhost\' origins. Staging environments need
their specific domains. Production environments should have the most
restrictive CORS settings, limited to known production origins.

#### Deployment Consistency

All instances should be updated consistently during deployments. Use
blue-green deployments where possible to avoid mixed instance
configurations. Implement proper health checks that verify CORS
configurations before routing traffic. Also, include CORS validation in
pre-deployment testing.

#### Caching

CORS responses may be cached by browsers or intermediaries. Always
include \'Vary: Origin\' header to ensure responses are cached
per-origin. Set appropriate \'Access-Control-Max-Age\' values to balance
performance and flexibility. Note that CDNs and other caching layers may
require purging after CORS configuration changes.

#### Load Balancer Specific Guidance

- For GCP load balancers: Use URL maps with host/path rules instead of
  redirects, when possible, as redirects can\'t include CORS headers.

- For AWS Application Load Balancers: Configure CORS policies at the ALB
  level in addition to backend servers.

- For Cloudflare: Use the Page Rules or Transform Rules features to add
  CORS headers at the edge rather than relying solely on origin server
  configuration.
