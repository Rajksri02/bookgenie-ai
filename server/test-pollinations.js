async function test() {
  try {
    const prompt = encodeURIComponent("A professional, aesthetic book cover titled 'Test Book'. Genre: Fantasy. Minimalist typography.");
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=800&height=1200&nologo=true`;
    console.log("Fetching from:", url);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("Success! Got image data length:", buffer.length);
  } catch (error) {
    console.error("Error:", error);
  }
}
test();
