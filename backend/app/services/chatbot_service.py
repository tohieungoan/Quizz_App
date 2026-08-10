"""
RAG Chatbot Service for QuizzApp.
Integrates Hybrid Search (FAISS + BM25) with Gemini LLM for User Assistant RAG queries.
"""
import os
from typing import List, Dict
from app.core.config import settings

# In-memory session store for chat history
# Format: { session_id: [HumanMessage, AIMessage, ...] }
_chat_sessions: Dict[str, List] = {}


class RAGChatbotService:
    def __init__(self):
        self.assistant_name = getattr(settings, "ASSISTANT_NAME", "Quizzy")
        self._initialized = False
        self.vectorstore = None
        self.vector_retriever = None
        self.bm25_retriever = None
        self.llm = None
        self.prompt = None
        self.contextualize_q_prompt = None

    def initialize(self):
        """
        Lazily initialize LangChain embeddings, document loaders, vector store, and LLM chain.
        """
        if self._initialized:
            return

        api_key = getattr(settings, "GOOGLE_API_KEY", None) or getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if api_key:
            os.environ["GOOGLE_API_KEY"] = api_key

        try:
            from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
            from langchain_text_splitters import RecursiveCharacterTextSplitter
            from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
            from langchain_community.vectorstores import FAISS
            from langchain_community.vectorstores.utils import DistanceStrategy
            from langchain_community.retrievers import BM25Retriever
            from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

            # 1. Load PDF documents from backend/papers directory
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            papers_dir = os.path.join(base_dir, "papers")
            
            docs = []
            if os.path.exists(papers_dir):
                loader = DirectoryLoader(
                    path=papers_dir,
                    glob="**/*.pdf",
                    loader_cls=PyPDFLoader,  # type: ignore[arg-type]
                    show_progress=False,
                    use_multithreading=True,
                )
                docs = loader.load()

            if not docs:
                # Fallback document if no PDFs found
                from langchain_core.documents import Document
                docs = [
                    Document(
                        page_content="QuizzApp is an interactive real-time quiz application allowing hosts to create exams and participants to join via 6-digit room PIN code.",
                        metadata={"source": "default_doc"}
                    )
                ]

            # 2. Split documents
            markdown_separators = [
                "\n#{1,6} ",
                "```\n",
                "\n\\*\\*\\*+\n",
                "\n---+ \n",
                "\n___+\n",
                "\n\n",
                "\n",
                " ",
                "",
            ]
            text_splitter = RecursiveCharacterTextSplitter(
                separators=markdown_separators,
                chunk_size=1200,
                chunk_overlap=200,
                length_function=len,
                add_start_index=True,
                strip_whitespace=True,
            )
            splits = text_splitter.split_documents(docs)

            # 3. Embeddings & Retrievers
            embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2")

            self.vectorstore = FAISS.from_documents(
                documents=splits,
                embedding=embeddings,
                distance_strategy=DistanceStrategy.COSINE,
            )
            self.vector_retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})

            self.bm25_retriever = BM25Retriever.from_documents(splits)
            self.bm25_retriever.k = 3

            # 4. LLM & Prompts setup
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-3.5-flash-lite",
                temperature=0,
            )

            prompts_dir = os.path.join(base_dir, "prompts")
            contextualize_path = os.path.join(prompts_dir, "contextualize_prompt.txt")
            qa_path = os.path.join(prompts_dir, "qa_system_prompt.txt")

            if os.path.exists(contextualize_path):
                with open(contextualize_path, "r", encoding="utf-8") as f:
                    contextualize_sys = f.read()
            else:
                contextualize_sys = "Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is."

            if os.path.exists(qa_path):
                with open(qa_path, "r", encoding="utf-8") as f:
                    qa_sys = f.read().replace("{assistant_name}", self.assistant_name)
            else:
                qa_sys = f"You are {self.assistant_name}, a helpful AI assistant for QuizzApp users."

            self.contextualize_q_prompt = ChatPromptTemplate.from_messages([
                ("system", contextualize_sys),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{question}"),
            ])

            self.prompt = ChatPromptTemplate.from_messages([
                ("system", qa_sys),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{question}"),
            ])

            self._initialized = True
        except Exception as err:
            print(f"[RAGChatbotService] Initialization error: {err}")
            raise err

    def hybrid_retrieve(self, query: str):
        """
        Retrieves top relevant documents using vector search + BM25 keyword search.
        """
        self.initialize()
        
        vector_docs = []
        if self.vector_retriever:
            try:
                vector_docs = self.vector_retriever.invoke(query)
            except Exception as err:
                print(f"[RAGChatbotService] Vector retrieval error: {err}")

        keyword_docs = []
        if self.bm25_retriever:
            try:
                keyword_docs = self.bm25_retriever.invoke(query)
            except Exception as err:
                print(f"[RAGChatbotService] BM25 retrieval error: {err}")

        seen = set()
        combined = []
        for doc in vector_docs + keyword_docs:
            content = doc.page_content.strip()
            if content not in seen:
                seen.add(content)
                combined.append(doc)
        return combined[:5]

    def _get_standalone_question(self, question: str, chat_history: List):
        from langchain_core.output_parsers import StrOutputParser
        if not chat_history:
            return question
        self.initialize()
        if not self.contextualize_q_prompt or not self.llm:
            return question
        chain = self.contextualize_q_prompt | self.llm | StrOutputParser()
        return chain.invoke({"question": question, "chat_history": chat_history})

    def process_chat(self, question: str, session_id: str = "default", user_context: str = "") -> str:
        """
        Process a user question, query RAG documents + real-time user DB context, and return AI response.
        """
        self.initialize()
        from langchain_core.messages import HumanMessage, AIMessage
        from langchain_core.output_parsers import StrOutputParser

        history = _chat_sessions.get(session_id, [])

        standalone_q = self._get_standalone_question(question, history)
        retrieved_docs = self.hybrid_retrieve(standalone_q)
        rag_context = "\n\n".join(doc.page_content for doc in retrieved_docs)

        combined_context = f"[PLATFORM_GUIDE]\n{rag_context}"
        if user_context.strip():
            combined_context += f"\n\n[USER_ACCOUNT_DATA]\n{user_context.strip()}"

        if not self.prompt or not self.llm:
            return "AI Assistant is currently unavailable. Please check backend initialization."

        qa_chain = self.prompt | self.llm | StrOutputParser()
        answer = qa_chain.invoke({
            "context": combined_context,
            "chat_history": history,
            "question": question
        })

        # Append to history (keep max 10 recent messages)
        history.append(HumanMessage(content=question))
        history.append(AIMessage(content=answer))
        if len(history) > 10:
            history = history[-10:]
        _chat_sessions[session_id] = history

        return answer

    def clear_history(self, session_id: str = "default"):
        """
        Clears chat history for given session.
        """
        if session_id in _chat_sessions:
            _chat_sessions[session_id].clear()


rag_chatbot_service = RAGChatbotService()
