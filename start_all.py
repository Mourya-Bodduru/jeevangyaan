import subprocess
import os
import time

def start_backend():
    print("Starting Node.js Backend...")
    return subprocess.Popen(["npm", "run", "dev"], cwd="backend")

def start_frontend():
    print("Starting Vite Frontend...")
    return subprocess.Popen(["npm", "run", "dev"], cwd="frontend/jeevangyaan")

def start_fastapi():
    print("Starting FastAPI AI Service...")
    return subprocess.Popen(["python", "start_fastapi.py"], cwd="fastapi-ai")

if __name__ == "__main__":
    processes = []
    try:
        processes.append(start_fastapi())
        time.sleep(5)  # Give AI service time to initialize
        processes.append(start_backend())
        processes.append(start_frontend())
        
        print("\nAll services are starting up. Press Ctrl+C to stop.\n")
        
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping services...")
        for p in processes:
            p.terminate()
        print("Done.")
