from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from fastapi.middleware.cors import CORSMiddleware
import faiss
import numpy as np
from google import genai
from dotenv import load_dotenv
import os

# =========================
# CONFIG
# =========================
load_dotenv("../.env")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing. Check your .env file.")

client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# =========================
# EMBEDDING MODEL
# =========================
embedding_model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)

# =========================
# GLOBAL STORAGE
# =========================
document_chunks = []
embedding_dimension = 384
faiss_index = faiss.IndexFlatL2(
    embedding_dimension
)

# =========================
# REQUEST MODEL
# =========================
class QuestionRequest(BaseModel):
    question: str

# =========================
# ROOT
# =========================
@app.get("/")
def root():
    return {
        "message": "AI Document Search RAG Chatbot API"
    }

# =========================
# PDF UPLOAD
# =========================
@app.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...)
):
    global document_chunks
    global faiss_index

    if not file.filename.endswith(".pdf"):
        return {
            "error": "Only PDF files are allowed"
        }

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_text(text)
    document_chunks = chunks

    embeddings = embedding_model.encode(chunks)
    faiss_index.reset()
    faiss_index.add(
        np.array(embeddings).astype("float32")
    )

    return {
        "message": "PDF uploaded, chunked, and embedded successfully",
        "filename": file.filename,
        "pages": len(reader.pages),
        "characters": len(text),
        "chunks": len(chunks),
        "embedding_dimension": embeddings.shape[1],
        "vectors_stored": faiss_index.ntotal
    }

# =========================
# ASK QUESTION
# =========================
@app.post("/ask")
async def ask_question(
    request: QuestionRequest
):
    global document_chunks
    global faiss_index

    if len(document_chunks) == 0:
        return {
            "error": "Please upload a PDF first"
        }

    question_embedding = embedding_model.encode(
        [request.question]
    )

    distances, indices = faiss_index.search(
        np.array(question_embedding).astype("float32"),
        k=3
    )

    relevant_chunks = []
    for idx in indices[0]:
        relevant_chunks.append(
            document_chunks[idx]
        )

    context = "\n\n".join(relevant_chunks)

    prompt = f"""
Answer the user's question using ONLY the provided context.

Context:
{context}

Question:
{request.question}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    answer = response.text

    return {
        "question": request.question,
        "answer": answer,
        "sources": relevant_chunks
    }
