import { useState, useRef, useEffect } from "react";
import { uploadPDF, askQuestion } from "../services/api";

function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatHistory]);

  const downloadAnswer = (text) => {
    const element = document.createElement("a");

    const file = new Blob([text], {
      type: "text/plain",
    });

    element.href = URL.createObjectURL(file);
    element.download = "answer.txt";

    document.body.appendChild(element);
    element.click();

    document.body.removeChild(element);
  };

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
    if (!question.trim()) {
      return;
    }

    const currentQuestion = question;

    try {
      setIsAsking(true);

      const result = await askQuestion(currentQuestion);

      setChatHistory((prevHistory) => [
        ...prevHistory,
        {
          question: currentQuestion,
          answer: result.answer,
          sources: result.sources || [],
        },
      ]);

      setQuestion("");
      console.log(result);
    } catch (error) {
      setChatHistory((prevHistory) => [
        ...prevHistory,
        {
          question: currentQuestion,
          answer: "Failed to get answer.",
          sources: [],
        },
      ]);
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
          <div className="mt-4 border border-blue-200 bg-blue-50 rounded-xl p-4">
            <p className="font-semibold text-blue-700">
              📄 {selectedFile.name}
            </p>

            <p className="text-sm text-gray-700 mt-1">
              📦 Size: {(selectedFile.size / 1024).toFixed(2)} KB
            </p>

            <p className="text-sm text-green-600 mt-1">
              ✅ Ready to Upload
            </p>
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
              setChatHistory([]);
            }}
            className="mt-4 ml-3 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700"
          >
            Clear
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Chat History</h2>

          {chatHistory.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 text-center">
              <p className="text-2xl mb-2">💬</p>

              <p className="font-semibold text-gray-700">
                No conversations yet
              </p>

              <p className="text-gray-500 mt-2">
                Upload a PDF and ask questions to start chatting with your
                document.
              </p>
            </div>
          )}

          {chatHistory.map((chat, index) => (
            <div
              key={index}
              className="mb-6 border border-gray-200 rounded-xl p-5 bg-gray-50 shadow-sm"
            >
              <div className="mb-4">
                <p className="text-sm font-semibold text-blue-600">Question</p>
                <p className="text-gray-800">{chat.question}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-green-600">Answer</p>
                <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {chat.answer}
                </p>
              </div>

              <div className="flex gap-3 flex-wrap mb-4">
                <button
                  onClick={() => navigator.clipboard.writeText(chat.answer)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Copy Answer
                </button>

                <button
                  onClick={() => downloadAnswer(chat.answer)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Download Answer
                </button>
              </div>

              {chat.sources.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Sources</h3>

                  <div className="border border-gray-200 rounded-xl p-4 bg-white max-h-[200px] overflow-y-auto text-sm">
                    {chat.sources.map((source, sourceIndex) => (
                      <p key={sourceIndex} className="mb-2">
                        • {source}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <div ref={chatEndRef}></div>
        </div>
      </div>
    </div>
  );
}

export default Home;
