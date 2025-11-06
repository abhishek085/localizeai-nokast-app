// Fix: Implemented the Gemini service for summarizing newsletters.
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Newsletter } from '../types';

// Per guidelines, initialize with API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Summarizes the content of given newsletters using the Gemini API.
 * This is a placeholder for a real implementation that would fetch newsletter content.
 * @param newslettersToSummarize - An array of newsletters to summarize.
 * @returns The summarized text as a string.
 */
export const summarizeNewsletters = async (
    newslettersToSummarize: Newsletter[]
): Promise<string> => {
    
    const newsletterContent = newslettersToSummarize
        .map(n => `
            Newsletter from: ${n.sender} (Priority: ${n.priority}/10)
            Email: ${n.email}
            ---
            [Content for ${n.sender} would be here]
            ---
        `)
        .join('\n\n');

    const prompt = `
        You are an expert at summarizing newsletters. You will be given a collection of newsletters with different priorities.
        Your task is to generate a concise, easy-to-read summary digest. 
        - Start with the most important updates from high-priority newsletters.
        - Group related topics if possible.
        - Use markdown for formatting (headings, bold text, bullet points).
        - Keep the entire summary under 400 words.

        Here are the newsletters to summarize:
        ${newsletterContent}
    `;

    try {
        // As per guidelines, use a basic text model for summarization.
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        // Per guidelines, access the text directly.
        return response.text;
    } catch (error) {
        console.error("Error summarizing newsletters with Gemini API:", error);
        throw new Error("Failed to generate summary. Please check your API key and network connection.");
    }
};

/**
 * Generates a response from the AI helper based on a summary and a user prompt.
 * @param summary - The current newsletter summary.
 * @param prompt - The user's request (e.g., "Create a tweet", "How does this app work?").
 * @returns The AI-generated response as a string.
 */
export const generateAIHelperResponse = async (summary: string, prompt: string): Promise<string> => {
    const fullPrompt = `
        You are an AI assistant for a local newsletter summarizer app called "LocalizeAI by Nokast".
        Your two main tasks are:
        1.  Help users create content (Tweets, LinkedIn posts, emails) based on the newsletter summary they provide.
        2.  Answer questions about how the "LocalizeAI" application works. The app is open-source, runs locally, and prioritizes user privacy. All data processing is done on the user's machine.

        Current Newsletter Summary:
        ---
        ${summary}
        ---

        User's Request: "${prompt}"

        Please provide a helpful response based on the user's request.
        - If the user asks for social media content, create it based on the summary.
        - If the user asks about the app, use your knowledge about its privacy-first, local-only features.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error with AI Helper:", error);
        return "Sorry, I encountered an error while processing your request.";
    }
};