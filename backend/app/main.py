import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    import uvicorn
    # Start the uvicorn server mapping to our app object
    uvicorn.run("app.server:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()
