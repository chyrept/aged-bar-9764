export interface Env {
  AI: any
  IMAGE_BUCKET: R2Bucket
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Parse the URL to get the prompt from the query string
    const url = new URL(request.url)
    const prompt = url.searchParams.get("prompt")

    // Check if a prompt was provided
    if (!prompt) {
      return new Response("Please provide a prompt in the URL query string", { status: 400 })
    }

    try {
      // Run the AI model with the provided prompt
      const imageBuffer = await env.AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", { prompt })

      // Generate a unique filename
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`

      // Upload the image to R2
      await env.MY_BUCKET.put(filename, imageBuffer, {
        httpMetadata: {
          contentType: "image/png",
        },
      })

      // Generate the public URL for the uploaded image
      const imageUrl = `https://pub-c947d778434f41f08f6bb0fd06fb4e60.r2.dev/${filename}`

      // Return the URL of the uploaded image
      return new Response(JSON.stringify({ url: imageUrl }), {
        headers: {
          "Content-Type": "application/json",
        },
      })
    } catch (error) {
      console.error("Error generating or uploading image:", error)
      return new Response("Error generating or uploading image", { status: 500 })
    }
  },
} satisfies ExportedHandler<Env>

