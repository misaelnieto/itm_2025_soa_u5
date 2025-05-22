FROM python:3.11-slim

WORKDIR /app

COPY conecta4_logic.py backend.py ./

RUN pip install fastapi uvicorn

EXPOSE 8091

CMD ["uvicorn", "backend:app", "--host", "0.0.0.0", "--port", "8091"]
