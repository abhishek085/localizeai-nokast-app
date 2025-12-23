import React from 'react';

export const AboutScreen: React.FC = () => {
  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">About Nokast</h2>
      <p className="text-lg text-gray-600 mb-6">Privacy-First Newsletter Intelligence</p>
      
      <div className="prose prose-lg text-gray-700 max-w-none space-y-6">
        <div>
          <p>
            Nokast is an open-source, privacy-first application designed to help you manage and understand your newsletter subscriptions without compromising your data.
          </p>
          <p>
            <strong>Built for privacy-first AI enthusiasts.</strong>
          </p>
          <p>
            Our core philosophy is simple: your data belongs to you. All processing, from fetching emails to generating AI-powered summaries, happens entirely on your local machine. Nothing is ever sent to a server.
          </p>
        </div>

        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 not-prose">Powered by Open Source</h3>
            <p>
            Nokast is built on the shoulders of giants. We proudly use these incredible open-source projects:
            </p>
            <ul className="not-prose list-disc pl-5 space-y-2">
                <li><strong className="font-semibold">Ollama:</strong> For running large language models like Llama 3 and Mistral locally on your machine.</li>
                <li><strong className="font-semibold">DuckDB:</strong> For high-performance, in-process analytical data management.</li>
                <li><strong className="font-semibold">React & Tailwind CSS:</strong> For building our responsive and modern user interface.</li>
            </ul>
        </div>
        
        <div>
            <p>
            We believe in the power of community and transparency. As an open-source project, we invite you to explore our code, contribute ideas, and help us build a better, more private way to interact with AI.
            </p>
            <a 
            href="https://github.com/nokast"
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-gray-800 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors no-underline"
            >
            View on GitHub
            </a>
        </div>
      </div>
    </div>
  );
};
