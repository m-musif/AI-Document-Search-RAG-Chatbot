const API_BASE_URL = "http://127.0.0.1:8000";

export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/upload-pdf`,
    {
      method: "POST",
      body: formData,
    }
  );

return await response.text();
};

export const askQuestion = async (question) => {
  const response = await fetch(
    `${API_BASE_URL}/ask`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    }
  );

return response.json();
};
