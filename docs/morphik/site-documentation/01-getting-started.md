# Getting Started with Morphik

This guide will help you set up Morphik, an agentic RAG platform for multi-modal data, on your local machine or server. For the latest details, see the [official documentation](https://docs.morphik.ai/getting-started).

---

## Installation Options

- **Direct Installation**
- **Docker**

---

## Direct Installation

### Prerequisites

- **Python 3.12** ([Download](https://www.python.org/downloads/release/python-3129/))
- **PostgreSQL 14** (with `pgvector` extension)

#### macOS
```bash
brew install postgresql@14
brew install pgvector
brew services start postgresql@14
createdb morphik
createuser -s postgres
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo apt install postgresql-14-pgvector
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo -u postgres createdb morphik
sudo -u postgres createuser -s postgres
```

#### Windows
1. [Download PostgreSQL](https://www.postgresql.org/download/windows/)
2. Set a password for the `postgres` user during install
3. Use pgAdmin to add the `pgvector` extension and create a `morphik` database

#### Verify PostgreSQL
```bash
psql -U postgres -c "SELECT version();"
```

#### Additional Dependencies
- **macOS**: `brew install poppler tesseract libmagic`
- **Ubuntu/Debian**: `sudo apt-get install -y poppler-utils tesseract-ocr libmagic-dev`
- **Windows**: Download [Poppler](https://github.com/oschwartz10612/poppler-windows/releases/), [Tesseract](https://github.com/UB-Mannheim/tesseract/wiki), and use `python-magic-bin` for libmagic

If you encounter DB initialization issues in Docker:
```bash
psql -U postgres -d morphik -a -f init.sql
```

---

### Installing Ollama (for local LLMs)

#### macOS
```bash
brew install ollama
ollama serve
ollama pull llama3.2
```

#### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
ollama pull llama3.2
```

#### Windows
1. [Download Ollama](https://ollama.com/download/windows)
2. Run installer, then:
```bash
ollama pull llama3.2
```

---

### Cloning the Repository

```bash
git clone https://github.com/morphik-org/morphik-core.git
cd morphik-core
```

---

### Setting Up the Environment

#### Create and Activate Virtual Environment
```bash
python3.12 -m venv .venv
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate.bat  # Windows (CMD)
.venv\Scripts\Activate.ps1  # Windows (PowerShell)
```

#### Install Python Dependencies
```bash
pip install -r requirements.txt
# For Python 3.12+
pip install unstructured==0.16.10
python -m nltk.downloader averaged_perceptron_tagger punkt
```

---

### Server Configuration

- Edit `morphik.toml` to customize models and features ([see config docs](https://docs.morphik.ai/configuration))
- Copy environment variables:
```bash
cp .env.example .env
```
- Add API keys to `.env` if using OpenAI/Anthropic
- Run setup script:
```bash
python quick_setup.py
```

---

### Launching the Server

```bash
python start_server.py
```

You should see output like:
```
INFO:     Started server process [15169]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://localhost:8000 (Press CTRL+C to quit)
```

---

## Using Docker

### Prerequisites
- Docker & Docker Compose
- 10GB+ free disk space
- 8GB+ RAM recommended

### Quick Start
```bash
git clone https://github.com/morphik-org/morphik-core.git
cd morphik-core
```
- Edit `morphik.toml` for Docker/Redis/Ollama settings
- For Ollama:
```bash
docker compose --profile ollama up --build -d
```
- For OpenAI/Anthropic:
```bash
docker compose up --build
```
- To stop:
```bash
docker compose down
```
- To reset (delete all data/models):
```bash
docker compose down -v
```

---

### Configuration
- Default: PostgreSQL + pgvector, Ollama, local file storage, basic auth
- Customize `.env` as needed:
```bash
JWT_SECRET_KEY=your-secure-key-here
OPENAI_API_KEY=sk-...
HOST=0.0.0.0
PORT=8000
```

---

### Accessing Services
- Morphik API: [http://localhost:8000](http://localhost:8000)
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health: [http://localhost:8000/health](http://localhost:8000/health)

---

## Troubleshooting

- **Service won't start:**
  ```bash
  docker compose logs
  docker compose logs morphik
  docker compose logs postgres
  docker compose logs ollama
  ```
- **Database issues:**
  - Check PostgreSQL: `docker compose ps`
  - Connect: `docker compose exec postgres psql -U morphik -d morphik`
- **Model download issues:**
  - Check Ollama logs: `docker compose logs ollama`
  - Ensure enough disk space
  - Restart Ollama: `docker compose restart ollama`
  - Check `morphik.toml` for correct Redis/Ollama endpoints
- **Ollama memory issues:**
  - Increase Docker memory (Docker Desktop > Resources > Memory)
  - Use a smaller model in `morphik.toml`
  - Switch to OpenAI API if needed
- **Performance:**
  - Monitor: `docker stats`
  - Ensure 8GB+ RAM
  - Check disk: `df -h`

---

## Community Support

- [Join Discord](https://discord.gg/BwMtv3Zaju) for help, bug reports, and discussion

---

## Next Steps

- [Configure Morphik](https://docs.morphik.ai/configuration)
- [API Reference](https://docs.morphik.ai/api-reference/ingest-text)
- [Python SDK](https://docs.morphik.ai/python-sdk/introduction)
- [Morphik UI & CLI](https://docs.morphik.ai/web-interface/introduction)

---

*Source: [Morphik Docs - Getting Started](https://docs.morphik.ai/getting-started)* 