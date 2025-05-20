# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy app code
COPY . /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variable to avoid .pyc files
ENV PYTHONDONTWRITEBYTECODE=1

# Run the app
CMD ["python", "app.py"]
