import { useState } from "react";
import { uploadPDF, askQuestion } from "../services/api";

function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [sources, setSources] = useState([]);

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage("Please select a PDF first.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadMessage("Uploading PDF...");

      const result = await uploadPDF(selectedFile);

      setUploadMessage("PDF uploaded successfully!");
      console.log(result);
    } catch (error) {
      setUploadMessage("Upload failed.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question) {
      setAnswer("Please write a question first.");
      return;
    }

    try {
      setIsAsking(true);
      setAnswer("Thinking...");

      const result = await askQuestion(question);

      setAnswer(result.answer);
      setSources(result.sources || []);
      console.log(result);
    } catch (error) {
      setAnswer("Failed to get answer.");
      console.error(error);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      <h1 className="text-4xl font-bold text-center text-blue-600 mb-10">
        AI Document Search RAG Chatbot
      </h1>

      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Upload PDF</h2>

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          className="block w-full border border-gray-300 rounded-lg p-3"
        />

        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isUploading ? "Uploading..." : "Upload PDF"}
        </button>

        {uploadMessage && (
          <p
            className={`mt-4 text-sm font-medium ${
              uploadMessage.includes("success")
                ? "text-green-600"
                : uploadMessage.includes("failed")
                ? "text-red-600"
                : "text-blue-600"
            }`}
          >
            {uploadMessage}
          </p>
        )}

        {selectedFile && (
          <div className="mt-3 text-sm text-blue-600 font-medium">
            Selected File: {selectedFile.name}
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Ask a Question</h2>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAskQuestion();
              }
            }}
            placeholder="Ask something about your uploaded PDF..."
            className="w-full border border-gray-300 rounded-lg p-3 h-32"
          />

          <button
            onClick={handleAskQuestion}
            disabled={isAsking}
            className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-300"
          >
            {isAsking ? "Thinking..." : "Ask Question"}
          </button>

          <button
            onClick={() => {
              setQuestion("");
              setAnswer("");
              setSources([]);
            }}
            className="mt-4 ml-3 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700"
          >
            Clear
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Answer</h2>

          <div className="mb-3">
            <button
              onClick={() => navigator.clipboard.writeText(answer)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Copy Answer
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 min-h-[150px] max-h-[300px] overflow-y-auto whitespace-pre-wrap shadow-sm text-gray-800 leading-relaxed">
            {answer || "Your AI-generated answer will appear here..."}
          </div>

          {sources.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">Sources</h3>

              <div className="border border-gray-200 rounded-xl p-4 bg-white max-h-[200px] overflow-y-auto text-sm">
                {sources.map((source, index) => (
                  <p key={index} className="mb-2">
                    • {source}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
