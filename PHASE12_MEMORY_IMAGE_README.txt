Cognicare NER - Memory Image Feature

The Saved Memories / Memory Match `.memory-card` CSS collision is fixed by giving Memory Vault saved cards unique class names.

The Memory Vault now supports optional images. Images are resized/compressed in the browser and stored with the memory in PostgreSQL. The user can add/change/remove an image from the memory form or click the image area on an existing saved memory.

Run once from the backend folder:
.\.venv\Scripts\python.exe migrate_memory_images.py
