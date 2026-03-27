import sys
import subprocess

def run_setup():
    print("Setting up FastAPI ML Service Environment...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        import uvicorn
        print("Starting FastAPI Server on port 8002...")
        uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
    except Exception as e:
        print(f"Failed to start: {e}")

if __name__ == "__main__":
    run_setup()
