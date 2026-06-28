# 🖥️ Private AI OS Shell (macOS)

![Status: Active](https://img.shields.io/badge/Status-Active-success)
![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Python](https://img.shields.io/badge/Python-FastAPI-3776AB?logo=python)
![LangChain](https://img.shields.io/badge/AI-LangChain-green)
![Ollama](https://img.shields.io/badge/Local-Ollama-black)

A highly secure, offline-first macOS desktop environment overlay. This project bypasses the standard macOS window manager to provide a fullscreen, immersive, AI-native shell. It combines a zero-latency Rust/React UI with a Python backend capable of streaming local LLM inferences, querying local Vector databases, and physically controlling the Mac hardware via native AppleScript execution.


## 🏗️ System Architecture

This project utilizes a **Decoupled Microservice Architecture** to ensure the visual interface never blocks or freezes during heavy LLM inference.

1. **The Visual Shell (Frontend):** Built with `Tauri` (Rust) and `React`. It runs as a native macOS application with global hotkey listeners (e.g., `CTRL+ESC` instant kill-switch), rendering a borderless, transparent web-view overlay.
2. **The Orchestrator (Backend):** A `FastAPI` Python server communicating with the UI via real-time WebSockets.
3. **The Engine (Local AI):** `Ollama` running entirely locally, ensuring 0 bytes of private data ever leave the machine.
4. **The Limbs (MCP Architecture):** Utilizing the Model Context Protocol concept, the AI is granted strict, sandboxed access to isolated tool servers:
    *   **Mac Controller Server:** Executes `osascript` to handle volume, app launching, and battery telemetry.
    *   **The Vault (ChromaDB):** A local RAG pipeline watching `~/MyAI_OS_Vault` to chunk, embed, and retrieve private documents.

## 🧠 Supported Local Models
This system is entirely model-agnostic via LangChain, provided they are served locally via Ollama. 
*   **Recommended:** `llama3.1:8b` (Highly optimized for native JSON Tool Calling and MCP routing).
*   **Supported:** `mistral`, `phi3`, `qwen2`.

---

## ⚙️ Local Installation & Setup 

Because this project bridges a native Rust binary, a Node environment, a Python WebSocket server, and a local Vector Database, the initial setup is non-trivial. Please follow these steps exactly.

### Prerequisites
Ensure your macOS environment has the following installed:
*   [Rust & Cargo](https://rustup.rs/) (For Tauri compilation)
*   [Node.js](https://nodejs.org/) (v18+)
*   [Python 3.10+](https://www.python.org/)
*   [Ollama](https://ollama.com/)

### 1. Initialize the AI Engine
Before starting the servers, ensure Ollama is running and the tool-calling model is pulled into local memory.
```bash
ollama run llama3.1
```
*(You can leave this running in the background).*

### 2. Configure the Backend (Python / FastAPI)
The orchestrator requires LangChain, ChromaDB, and FastAPI.
```bash
# Navigate to the backend folder
cd myai-backend

# Create and activate a clean virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn websockets langchain langchain-core langchain-ollama chromadb

# Start the WebSocket Orchestrator
uvicorn main:app --reload
```
*The backend is now listening on `ws://localhost:8000/ws`.*

### 3. Compile and Launch the Frontend (Tauri / React)
Open a **new terminal window** (keep the backend running).
```bash
# Navigate to the frontend folder
cd myai-os

# Install React dependencies
npm install

# Compile the Rust binary and launch the OS Shell
npm run tauri dev
```

---

## 🛠️ Usage & MCP Configuration

Once the Shell boots, it will take over your screen. 
*   **Escape Hatch:** Press `CTRL + ESC` at any time to kill the Tauri process and return to standard macOS.
*   **Hardware Control:** Try typing: *"Set volume to 50% and check battery."* The LangChain agent will route this intent to the AppleScript MCP tools, execute them natively, and stream the hardware telemetry back to the UI.

## 🔒 Security & Privacy (The Sandbox)
*   **No Internet Access:** The FastAPI server is designed to be firewalled (via LuLu or Little Snitch) to block outbound connections. All LLM inferences and RAG embeddings (`nomic-embed-text`) are processed locally.
*   **Directory Traversal Protection:** The upcoming ChromaDB Vault agent is hard-coded to reject file paths resolving outside of `~/MyAI_OS_Vault`.
```
