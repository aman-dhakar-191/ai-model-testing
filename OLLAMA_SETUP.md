# Ollama Local Model Setup

This application now supports running local AI models through Ollama alongside OpenRouter cloud models.

## Prerequisites

1. **Install Ollama**: Download and install from [ollama.ai](https://ollama.ai)
2. **Start Ollama**: Ollama runs as a background service on port 11434 by default

## Pulling Models

Before using a model, you need to pull it to your local machine:

```bash
# Recommended for your system (8GB model)
ollama pull llama3.1:8b

# Other options
ollama pull llama3.2:3b          # Smaller, faster
ollama pull qwen2.5-coder:7b     # Good for coding tasks
ollama pull deepseek-r1:8b       # Reasoning model
ollama pull mistral:7b           # General purpose
```

## Using Ollama in the App

1. Open Settings in the app
2. Change **Provider** from "OpenRouter (Cloud)" to "Ollama (Local)"
3. Verify **Ollama Base URL** is set to `http://localhost:11434`
4. Select your desired model from the **Model** dropdown
5. Start chatting!

## Advantages of Ollama

✅ **Privacy**: All processing happens locally on your machine  
✅ **No API Key**: No need for cloud API credentials  
✅ **Offline**: Works without internet connection  
✅ **Free**: No usage costs  
✅ **Fast**: Low latency for small to medium models  

## System Requirements

For **llama3.1:8b** (recommended for your system):
- **RAM**: 8GB+ available
- **Disk**: ~4.7GB storage
- **CPU/GPU**: GPU acceleration recommended but not required

## Checking Ollama Status

```bash
# List pulled models
ollama list

# Test Ollama is running
curl http://localhost:11434/api/tags

# Start a model manually (optional)
ollama run llama3.1:8b
```

## Troubleshooting

### "Unable to connect to Ollama"
- Ensure Ollama is installed and running
- Check if port 11434 is accessible: `curl http://localhost:11434`
- Verify the base URL in settings is correct

### Model not in dropdown
- Pull the model first using `ollama pull <model-name>`
- The app lists common models - you can use any Ollama model by typing the exact name

### Slow performance
- Try a smaller model like `llama3.2:3b` or `phi3:mini`
- Enable GPU acceleration if you have a compatible GPU
- Close other memory-intensive applications

## Switching Between Providers

You can easily switch between Ollama (local) and OpenRouter (cloud) models:
1. Change the **Provider** setting
2. Select a model from the new provider
3. The app will automatically use the appropriate API endpoint

Both providers support:
- Tool calling
- Streaming responses
- System prompts
- Temperature control
