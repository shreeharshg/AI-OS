import asyncio
import subprocess
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool

app = FastAPI()

# ==========================================
# 1. THE TOOLS (MAC SYSTEM CONTROLLERS)
# ==========================================

@tool
def get_battery_status() -> str:
    """Always use this tool when the user asks about their battery level or power status."""
    try:
        # Runs the native Mac command 'pmset -g batt'
        result = subprocess.run(["pmset", "-g", "batt"], capture_output=True, text=True)
        return result.stdout
    except Exception as e:
        return f"Failed to read battery: {e}"

@tool
def set_mac_volume(volume_level: int) -> str:
    """Use this tool to change the system volume. The volume_level must be between 0 and 100."""
    try:
        # Runs native AppleScript to change volume
        script = f"set volume output volume {volume_level}"
        subprocess.run(["osascript", "-e", script])
        return f"Volume successfully set to {volume_level}%."
    except Exception as e:
        return f"Failed to set volume: {e}"

# List of tools to give to the AI
system_tools = [get_battery_status, set_mac_volume]
tools_by_name = {tool.name: tool for tool in system_tools}

# ==========================================
# 2. INITIALIZE AI & BIND TOOLS
# ==========================================

# Notice we changed to llama3.1 for tool-calling capabilities
llm = ChatOllama(model="llama3.1", temperature=0.1)
llm_with_tools = llm.bind_tools(system_tools)

SYSTEM_PROMPT = """
You are the core intelligence of a private Operating System. 
You have physical control over the host Mac.
If the user gives a system command (like checking battery or setting volume), you MUST use your tools to execute it.
Do not guess the battery level. Use the tool.
Be highly concise.
"""

# ==========================================
# 3. WEBSOCKET BRIDGE
# ==========================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("React UI Connected to Python Brain.")
    
    # We store chat history here so the AI remembers context
    chat_history = [SystemMessage(content=SYSTEM_PROMPT)]
    
    try:
        while True:
            user_input = await websocket.receive_text()
            print(f"Command Received: {user_input}")
            
            chat_history.append(HumanMessage(content=user_input))
            
            # 1. Ask the LLM what to do
            # We don't stream immediately, because the AI might want to use a tool first
            ai_msg = llm_with_tools.invoke(chat_history)
            chat_history.append(ai_msg)
            
            # 2. Check if the AI decided to use a tool
            if ai_msg.tool_calls:
                for tool_call in ai_msg.tool_calls:
                    selected_tool = tools_by_name[tool_call["name"].lower()]
                    tool_args = tool_call["args"]
                    
                    # Tell React we are executing a system command
                    await websocket.send_text(f"[SYSTEM] Executing tool: {selected_tool.name}...\n")
                    
                    # Actually run the Mac command (e.g., set volume)
                    tool_result = selected_tool.invoke(tool_args)
                    
                    # Add the result to memory
                    chat_history.append(ToolMessage(tool_call_id=tool_call["id"], name=selected_tool.name, content=str(tool_result)))
                
                # 3. Ask the AI to summarize the result of the tool
                final_response = llm_with_tools.invoke(chat_history)
                chat_history.append(final_response)
                await websocket.send_text(final_response.content)
                await websocket.send_text("[DONE]")
                
            else:
                # If no tool was needed, just stream the text back normally
                await websocket.send_text(ai_msg.content)
                await websocket.send_text("[DONE]")
            
    except WebSocketDisconnect:
        print("React UI Disconnected.")