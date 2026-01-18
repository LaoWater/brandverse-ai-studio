# Media Processing Service Dockerfile
# Python 3.12 with FFmpeg for video processing

FROM python:3.12-slim

# Install FFmpeg, fonts packages, and cleanup
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ffmpeg \
        fontconfig \
        fonts-dejavu-core \
        curl \
        unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create fonts directory
RUN mkdir -p /usr/share/fonts/custom

# Download fonts from Google Fonts API (simpler, more reliable)
# Using fontsource CDN which has consistent structure

# Download static font files (not variable fonts) for FFmpeg compatibility
# Using fontsource which provides static weights
RUN mkdir -p /usr/share/fonts/custom && \
    # Inter - static weights from fontsource
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf" -o /usr/share/fonts/custom/Inter-Regular.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf" -o /usr/share/fonts/custom/Inter-Bold.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-300-normal.ttf" -o /usr/share/fonts/custom/Inter-Light.ttf && \
    # Montserrat
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-400-normal.ttf" -o /usr/share/fonts/custom/Montserrat-Regular.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-700-normal.ttf" -o /usr/share/fonts/custom/Montserrat-Bold.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-300-normal.ttf" -o /usr/share/fonts/custom/Montserrat-Light.ttf && \
    # Roboto
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-400-normal.ttf" -o /usr/share/fonts/custom/Roboto-Regular.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-700-normal.ttf" -o /usr/share/fonts/custom/Roboto-Bold.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-300-normal.ttf" -o /usr/share/fonts/custom/Roboto-Light.ttf && \
    # Playfair Display
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-400-normal.ttf" -o /usr/share/fonts/custom/PlayfairDisplay-Regular.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-700-normal.ttf" -o /usr/share/fonts/custom/PlayfairDisplay-Bold.ttf && \
    # Oswald
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/oswald@latest/latin-400-normal.ttf" -o /usr/share/fonts/custom/Oswald-Regular.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/oswald@latest/latin-700-normal.ttf" -o /usr/share/fonts/custom/Oswald-Bold.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/oswald@latest/latin-300-normal.ttf" -o /usr/share/fonts/custom/Oswald-Light.ttf && \
    # Open Sans
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/open-sans@latest/latin-400-normal.ttf" -o /usr/share/fonts/custom/OpenSans-Regular.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/open-sans@latest/latin-700-normal.ttf" -o /usr/share/fonts/custom/OpenSans-Bold.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/open-sans@latest/latin-300-normal.ttf" -o /usr/share/fonts/custom/OpenSans-Light.ttf && \
    # Lato
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/lato@latest/latin-400-normal.ttf" -o /usr/share/fonts/custom/Lato-Regular.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/lato@latest/latin-700-normal.ttf" -o /usr/share/fonts/custom/Lato-Bold.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/lato@latest/latin-300-normal.ttf" -o /usr/share/fonts/custom/Lato-Light.ttf && \
    # Poppins
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-400-normal.ttf" -o /usr/share/fonts/custom/Poppins-Regular.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-700-normal.ttf" -o /usr/share/fonts/custom/Poppins-Bold.ttf && \
    curl -sL "https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-300-normal.ttf" -o /usr/share/fonts/custom/Poppins-Light.ttf && \
    # Verify fonts were downloaded
    ls -la /usr/share/fonts/custom/

# Update font cache
RUN fc-cache -f -v

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create temp directory for processing
RUN mkdir -p /tmp/media-processing

# Expose port (Cloud Run uses 8080 by default)
EXPOSE 8080

# Run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
