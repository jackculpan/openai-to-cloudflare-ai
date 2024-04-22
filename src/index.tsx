
// Define the structure for the environment variables, specifically the AI model interface
export interface Env {
  AI: {
    run: (model: string, options: { messages: Array<{ role: string; content: string }> }) => Promise<{ response: string, error?: string }>;
  };
}

// Default export of an object containing the fetch method
export default {
  // Asynchronous fetch method to handle requests
  async fetch(request: Request, env: Env) {
    try {
      // Parse the JSON body from the request
      const requestData = await request.json() as { messages: Array<{ role: string; content: string }> };

      // Map over the messages to extract necessary fields
      const messages = requestData.messages.map((message) => ({
        role: message.role,
        content: message.content
      }));

      // Run the AI model with the messages and store the result
      const result = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: messages,
      });

      // Check for errors in the result
      if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Construct the choices object with the AI's response
      const choices = [
        {
          message: {
            content: result.response,
          }
        },
      ];

      // Return a new HTTP response with the choices object as a JSON string
      return new Response(JSON.stringify({ choices }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      // Handle unexpected errors
      return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}
