import { useState, useEffect, useRef } from "react";

// Define the shape of our chat messages
interface Message {
  sender: "user" | "system";
  text: string;
}

function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [bootText, setBootText] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentStream, setCurrentStream] = useState("");
  
  // Reference to our WebSocket connection
  const ws = useRef<WebSocket | null>(null);

  // 1. THE PANIC KEY (CTRL + ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); 
        return;
      }
      if (e.ctrlKey && e.key === "Escape") {
        window.close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 2. THE BOOT ANIMATION
  useEffect(() => {
    const sequence: string[] = [
      "System Initializing...",
      "Bypassing Darwin Kernel...",
      "Memory Loaded...",
      "AI Core Online."
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < sequence.length) {
        setBootText((prev) => [...prev, sequence[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
        // Animation finished, transition to OS Interface
        setTimeout(() => setIsBooting(false), 1000); 
      }
    }, 600); 

    return () => clearInterval(interval);
  }, []);

  // 3. WEBSOCKET CONNECTION (Connects after boot)
  useEffect(() => {
    if (!isBooting) {
      ws.current = new WebSocket("ws://localhost:8000/ws");
      
      ws.current.onmessage = (event) => {
        if (event.data === "[DONE]") {
          // Streaming finished, save currentStream to messages, clear stream
          setCurrentStream((prev) => {
            setMessages((msgs) => [...msgs, { sender: "system", text: prev }]);
            return "";
          });
        } else {
          // Append incoming word to the streaming text
          setCurrentStream((prev) => prev + event.data);
        }
      };

      return () => {
        ws.current?.close();
      };
    }
  }, [isBooting]);

  // 4. HANDLE SENDING COMMANDS
  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      // Add user message to screen
      setMessages((prev) => [...prev, { sender: "user", text: inputValue }]);
      // Send to Python
      ws.current?.send(inputValue);
      // Clear input
      setInputValue("");
    }
  };

  // --- RENDER BOOT SCREEN ---
  if (isBooting) {
    return (
      <div className="w-full h-full bg-black flex flex-col justify-center items-start p-10 font-mono text-matrix-green text-2xl tracking-widest leading-loose">
        {bootText.map((text, index) => (
          <div key={index} className="animate-pulse">{text}</div>
        ))}
        {bootText.length === 4 && (
          <div className="mt-4 flex items-center">
            <span className="mr-2">&gt;</span>
            <span className="w-4 h-8 bg-matrix-green animate-bounce"></span>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER OS INTERFACE ---
  return (
    <div className="w-full h-full bg-black flex flex-col p-10 font-mono text-matrix-green">
      {/* Top Bar */}
      <div className="w-full border-b border-matrix-green/30 pb-2 mb-4 text-sm opacity-50 flex justify-between">
        <span>MyAI-OS [Version 1.0]</span>
        <span>STATUS: ONLINE</span>
      </div>

      {/* Chat / Output Area */}
      <div className="flex-grow overflow-y-auto flex flex-col gap-4 text-xl">
        <div className="text-matrix-green/70">Awaiting Objective...</div>
        
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.sender === "user" ? "text-white opacity-80" : ""}>
            {msg.sender === "user" ? "> " : ""}
            {msg.text}
          </div>
        ))}
        
        {/* The Live Streaming Text */}
        {currentStream && (
          <div className="animate-pulse">{currentStream}</div>
        )}
      </div>

      {/* Input Terminal */}
      <div className="mt-4 flex items-center border-t border-matrix-green/30 pt-4">
        <span className="mr-4 text-2xl">&gt;</span>
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleCommand}
          autoFocus
          className="bg-transparent border-none outline-none text-white text-2xl w-full"
          placeholder="Enter command..."
        />
      </div>
    </div>
  );
}

export default App;