from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from src.services.arxiv_tools import get_research_tools
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

import os, json

load_dotenv()

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

class ToolAgent:
    def __init__(self):
        llm = HuggingFaceEndpoint(
            repo_id="deepseek-ai/DeepSeek-V3.2-Exp",
            task="text-generation",
            huggingfacehub_api_token=HUGGINGFACE_API_KEY
        )
        self.chat_model = ChatHuggingFace(llm = llm)
        self.tools = get_research_tools()
        self.chat_history = []
        self.chat_template = ChatPromptTemplate([SystemMessage("You are a helpful AI Assistant, you are provided with a context you can use that context to frame your answers. if no context is given answer according to the query"), MessagesPlaceholder(variable_name="chat_history")])
        
    
    def get_chat_agent(self):
        """create an agent with tool calling functionality"""
        return self.chat_model.bind_tools(tools=self.tools)
    
    def get_research_context(self, query: str):
        """Run query with tool-calling support"""
        agent = self.get_chat_agent()
        result = agent.invoke(query)

        # if model wants to call a tool
        if hasattr(result, "additional_kwargs") and result.additional_kwargs.get("tool_calls"):
            tool_call = result.additional_kwargs["tool_calls"][0]
            tool_name = tool_call["function"]["name"]
            args = json.loads(tool_call["function"]["arguments"])

            # print(f"🧰 Model requested tool: {tool_name}({args})")

            # find and execute the matching tool
            for tool in self.tools:
                if tool.name == tool_name:
                    tool_result = tool.run(tool_input=args)
                    return {"tool_result": [r.model_dump() for r in tool_result]}

        # else just return model content
        return {"response": result.content}
    
    def invoke(self, query: str):
        """send to tool result to the llm"""
        context = self.get_research_context(query)
        prompt = f"Context: {context}\n Question: {query}"
        self.chat_history.append(HumanMessage(prompt))
        return self.chat_template.invoke({"chat_history": self.chat_history})
    
    def add_AIMessage(self, ai_message: str):
        self.chat_history.append(AIMessage(ai_message))
