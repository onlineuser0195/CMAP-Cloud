FROM python:3.10-slim

WORKDIR /app

COPY . .

RUN apt-get update && \
    apt-get install -y tesseract-ocr poppler-utils && \
    pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "80"]

# # Use slim Python base
# FROM python:3.10-slim

# # Install OCR dependencies
# RUN apt-get update && apt-get install -y \
#     tesseract-ocr \
#     tesseract-ocr-eng \
#     poppler-utils \
#     && rm -rf /var/lib/apt/lists/*

# # Set working directory
# WORKDIR /app

# # Copy everything into the container
# COPY . .

# # Install Python dependencies
# RUN pip install --no-cache-dir -r requirements.txt

# # Expose port (use the one your app runs on)
# EXPOSE 80

# # Set Python path if modules are outside
# ENV PYTHONPATH="${PYTHONPATH}:/app/python_ifm:/app/python_ocr"

# # Run your app
# CMD ["python", "python_ocr/app.py"]
