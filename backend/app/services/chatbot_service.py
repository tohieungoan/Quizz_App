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
        Supports both OpenAI (OPENAI_API_KEY) and Google Gemini (GEMINI_API_KEY).
        """
        if self._initialized:
            return

        openai_key = getattr(settings, "OPENAI_API_KEY", None) or os.getenv("OPENAI_API_KEY")
        gemini_key = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY")
        google_key = getattr(settings, "GOOGLE_API_KEY", None) or os.getenv("GOOGLE_API_KEY")

        # Detect OpenAI key (starts with sk-)
        sk_key = None
        for k in [openai_key, google_key, gemini_key]:
            if k and k.strip().startswith("sk-"):
                sk_key = k.strip()
                break

        # Detect Google Gemini key
        g_key = None
        for k in [gemini_key, google_key]:
            if k and k.strip() and not k.strip().startswith("sk-"):
                g_key = k.strip()
                break
        if not g_key and (gemini_key or google_key):
            g_key = (gemini_key or google_key or "").strip()

        try:
            from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
            from langchain_text_splitters import RecursiveCharacterTextSplitter
            from langchain_community.vectorstores import FAISS
            from langchain_community.vectorstores.utils import DistanceStrategy
            from langchain_community.retrievers import BM25Retriever
            from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

            # 1. Load PDF documents from backend/papers directory
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            papers_dir = os.path.join(base_dir, "papers")
            
            docs = []
            if os.path.exists(papers_dir):
                try:
                    loader = DirectoryLoader(
                        path=papers_dir,
                        glob="**/*.pdf",
                        loader_cls=PyPDFLoader,  # type: ignore[arg-type]
                        show_progress=False,
                        use_multithreading=True,
                    )
                    docs = loader.load()
                except Exception as loader_err:
                    print(f"[RAGChatbotService] PDF loader error: {loader_err}")

            if not docs:
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

            # 3. BM25 Keyword Retriever (offline safe)
            try:
                self.bm25_retriever = BM25Retriever.from_documents(splits)
                self.bm25_retriever.k = 3
            except Exception as bm_err:
                print(f"[RAGChatbotService] BM25 retriever setup error: {bm_err}")

            # 4. Initialize Provider (OpenAI or Gemini)
            if sk_key:
                os.environ["OPENAI_API_KEY"] = sk_key
                try:
                    from langchain_openai import OpenAIEmbeddings, ChatOpenAI
                    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
                    self.vectorstore = FAISS.from_documents(
                        documents=splits,
                        embedding=embeddings,
                        distance_strategy=DistanceStrategy.COSINE,
                    )
                    self.vector_retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})
                except Exception as emb_err:
                    print(f"[RAGChatbotService] OpenAI embeddings error: {emb_err}")
                    self.vectorstore = None
                    self.vector_retriever = None

                try:
                    from langchain_openai import ChatOpenAI
                    self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
                except Exception as llm_err:
                    print(f"[RAGChatbotService] OpenAI LLM error: {llm_err}")

            elif g_key:
                os.environ["GOOGLE_API_KEY"] = g_key
                try:
                    from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
                    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
                    self.vectorstore = FAISS.from_documents(
                        documents=splits,
                        embedding=embeddings,
                        distance_strategy=DistanceStrategy.COSINE,
                    )
                    self.vector_retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})
                except Exception as emb_err:
                    print(f"[RAGChatbotService] Gemini embeddings error: {emb_err}")
                    self.vectorstore = None
                    self.vector_retriever = None

                try:
                    from langchain_google_genai import ChatGoogleGenerativeAI
                    self.llm = ChatGoogleGenerativeAI(model="models/gemini-3.5-flash", temperature=0)
                except Exception as llm_err:
                    print(f"[RAGChatbotService] Gemini LLM error: {llm_err}")

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
        try:
            self.initialize()
        except Exception:
            pass
        
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
        try:
            self.initialize()
        except Exception:
            return question

        if not self.contextualize_q_prompt or not self.llm:
            return question
        try:
            chain = self.contextualize_q_prompt | self.llm | StrOutputParser()
            return chain.invoke({"question": question, "chat_history": chat_history})
        except Exception:
            return question

    def process_chat(self, question: str, session_id: str = "default", user_context: str = "") -> str:
        """
        Process a user question, query RAG documents + real-time user DB context, and return AI response.
        """
        try:
            self.initialize()
        except Exception as init_err:
            err_str = str(init_err)
            if "API_KEY_INVALID" in err_str or "API key not valid" in err_str or "INVALID_ARGUMENT" in err_str or "400" in err_str:
                return "Dịch vụ AI Chatbot hiện tại không thể kết nối tới Google Gemini API do API Key (GEMINI_API_KEY) trong cấu hình backend (.env) chưa đúng hoặc không hợp lệ. Vui lòng cập nhật API Key chính xác từ Google AI Studio."
            return f"Không thể khởi tạo dịch vụ AI Chatbot: {err_str}"

        if not self.llm:
            return "Dịch vụ AI Chatbot chưa sẵn sàng do chưa được cấu hình API Key (GEMINI_API_KEY) hợp lệ trong file .env."

        from langchain_core.messages import HumanMessage, AIMessage
        from langchain_core.output_parsers import StrOutputParser

        history = _chat_sessions.get(session_id, [])

        try:
            standalone_q = self._get_standalone_question(question, history)
            retrieved_docs = self.hybrid_retrieve(standalone_q)
            rag_context = "\n\n".join(doc.page_content for doc in retrieved_docs)

            combined_context = f"[PLATFORM_GUIDE]\n{rag_context}"
            if user_context.strip():
                combined_context += f"\n\n[USER_ACCOUNT_DATA]\n{user_context.strip()}"

            if not self.prompt or not self.llm:
                return "AI Assistant is currently unavailable."

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
        except Exception as err:
            err_msg = str(err)
            if "insufficient_quota" in err_msg or "credit_balance_exhausted" in err_msg or "429" in err_msg:
                return "Dịch vụ AI Chatbot: Key OpenAI hiện tại đã hết dung lượng/credit sử dụng (Lỗi 429 Insufficient Quota). Vui lòng kiểm tra tài khoản OpenAI hoặc cung cấp GEMINI_API_KEY miễn phí từ Google AI Studio (https://aistudio.google.com/) vào file `backend/.env`."
            if any(k in err_msg for k in ["API_KEY_INVALID", "API key not valid", "INVALID_ARGUMENT", "NOT_FOUND", "400", "404"]):
                return "Dịch vụ AI Chatbot hiện tại chưa thể phản hồi do API Key trong file cấu hình `.env` chưa chính xác hoặc không hợp lệ. Vui lòng cung cấp API Key chuẩn từ Google AI Studio (https://aistudio.google.com/) hoặc OpenAI vào `backend/.env`."
            print(f"[RAGChatbotService] process_chat error: {err}")
            return f"Đã xảy ra lỗi khi xử lý câu hỏi từ AI Chatbot: {err_msg}"

    def clear_history(self, session_id: str = "default"):
        """
        Clears chat history for given session.
        """
        if session_id in _chat_sessions:
            _chat_sessions[session_id].clear()


rag_chatbot_service = RAGChatbotService()
