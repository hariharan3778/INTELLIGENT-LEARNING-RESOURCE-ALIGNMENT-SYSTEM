const { GoogleGenerativeAI } = require('@google/generative-ai');
const apiKey = "AIzaSyBnu9DMN7fq6HMxjb-gwvS5_i2FnEvmfVw";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function run() {
    try {
        console.log("Trying with gemini-2.5-flash...");
        const result = await model.generateContent("Hi");
        console.log("Success with 2.5!");
        console.log("Text:", result.response.text());
        return;
    } catch(e) {
        console.error("Error with gemini-2.5-flash:", e.message);
    }

    try {
        console.log("\nTrying with gemini-2.0-flash...");
        const model2 = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model2.generateContent("Hi");
        console.log("Success with 2.0!");
        console.log("Text:", result.response.text());
        return;
    } catch(e) {
        console.error("Error with gemini-2.0-flash:", e.message);
    }

    try {
        console.log("\nTrying with gemini-1.5-flash...");
        const model15 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model15.generateContent("Hi");
        console.log("Success with 1.5!");
        console.log("Text:", result.response.text());
        return;
    } catch(e) {
        console.error("Error with gemini-1.5-flash:", e.message);
    }
}
run();
