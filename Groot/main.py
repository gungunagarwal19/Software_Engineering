import os
import gradio as gr
import time
import Groot
import sys
#import webview
import shutil
import logging
from colorama import Fore, Back, Style
import threading
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
unrestricted = False

def trash(k):
    yield k

def handleCheck(checked):
    global unrestricted
    unrestricted = checked
    logging.info(f"Unrestricted mode set to: {unrestricted}")

def fileUpload(history, file, request: gr.Request):
    try:
        # Ensure the file path is properly handled
        file_path = Path(file.name)
        with open(file_path, "r", encoding="utf-8") as f:
            Data = f.read()
        
        Groot.processSample(Data, file_path.name, unrestricted)
        history = history + [(None, f"File added to vector database: {file_path.name} as {'unrestricted' if unrestricted else 'restricted'}.")]
        logging.info(f"File uploaded and processed: {file_path.name}")
        return history
    except Exception as e:
        logging.error(f"Error processing file upload: {str(e)}")
        history = history + [(None, f"Error processing file: {str(e)}")]
        return history

def reset_chat():
    Groot.reset_chat_history()
    return [], "Chat history has been reset."

with gr.Blocks(css=".gradio-container {max-width: 800px !important}") as demo:
    gr.Markdown(
    """
    # Groot!
    RAG enhanced GPT-3 model.
    """)
    chatbot = gr.Chatbot(avatar_images=[None,"https://i.imgur.com/ixEn0m3.png"])
    
    with gr.Column():
        msg = gr.Textbox(
            show_label=False,
            placeholder="Talk to groot...",
            container=False,
        )
        with gr.Row():
            gr.Interface(handleCheck, gr.Checkbox(label="Unrestricted"), outputs=None, live=True, clear_btn="")
            btn = gr.UploadButton("Dataset File", scale=3, file_types=["Text"])
    
    with gr.Row():
        clear = gr.ClearButton([msg, chatbot], value="Clear Chat")
        reset = gr.Button("Reset Chat History")
    
    def respond(prompt, chat_history):
        if prompt == "exit":
            sys.exit(0)
        try:
            similarChunks = Groot.queryDatabase(prompt, unrestricted)
            logging.info(f"Found {len(similarChunks)} similar chunks")

            resp = Groot.generateResponse(True, similarChunks, prompt)
            # print("resp = ", resp)
            chat_history.append((prompt, resp))
            time.sleep(0.5)  # Reduced delay for better responsiveness
            return "", chat_history
        except Exception as e:
            logging.error(f"Error generating response: {str(e)}")
            chat_history.append((prompt, f"I encountered an error: {str(e)}"))
            return "", chat_history
    
    file_msg = btn.upload(fileUpload, [chatbot, btn], [chatbot], queue=False).then(
        trash, chatbot, chatbot
    )

    msg.submit(respond, [msg, chatbot], [msg, chatbot])
    reset.click(reset_chat, [], [chatbot, msg])

if __name__ == "__main__":
    print(Fore.YELLOW, "\n  * Initializing Groot\n", Style.RESET_ALL)
    
    try:
        # Ensure Dataset directory exists with proper permissions
        dataset_dir = Path("Dataset")
        embedded_dir = dataset_dir / "Embedded"
        
        # Create directories if they don't exist
        dataset_dir.mkdir(mode=0o777, exist_ok=True)
        embedded_dir.mkdir(mode=0o777, exist_ok=True)
        
        # Process existing files
        files = [f for f in os.listdir(dataset_dir) if (
            os.path.isfile(dataset_dir / f) and 
            not f.endswith(".json") and 
            f != "Embedded" 
        )]

        print(files)
        
        if len(files) > 0:
            logging.info(f"Files to process: {len(files)}")
            for file in files:
                try:
                    file_path = dataset_dir / file
                    target_path = embedded_dir / file
                    
                    # Check if we have read permission on the source file
                    if not os.access(file_path, os.R_OK):
                        logging.error(f"No read permission for file: {file}")
                        continue
                        
                    # Check if we have write permission on the target directory
                    if not os.access(embedded_dir, os.W_OK):
                        logging.error(f"No write permission for directory: {embedded_dir}")
                        break
                    
                    with open(file_path, "r", encoding="utf-8") as f:
                        Data = f.read()
                    Groot.processSample(Data, file, True)
                    
                    # Use shutil.move with error handling
                    if target_path.exists():
                        target_path.unlink()  # Remove existing file if it exists
                    shutil.move(str(file_path), str(target_path))
                    logging.info(f"Processed and moved file: {file}")
                    
                except PermissionError as pe:
                    logging.error(f"Permission error processing {file}: {str(pe)}")
                except Exception as e:
                    logging.error(f"Error processing file {file}: {str(e)}")
                    
    except PermissionError as pe:
        logging.error(f"Permission error creating directories: {str(pe)}")
        print(Fore.RED, f"\nError: Insufficient permissions. Please run with appropriate privileges.\n{str(pe)}", Style.RESET_ALL)
        sys.exit(1)
    except Exception as e:
        logging.error(f"Initialization error: {str(e)}")
        print(Fore.RED, f"\nError during initialization: {str(e)}", Style.RESET_ALL)
        sys.exit(1)
    
    # Launch the application
    demo.launch()
    
