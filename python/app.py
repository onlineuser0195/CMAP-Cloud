from fastapi import FastAPI
from python_ifm.app import ifm_router
# from python_ocr.app import ocr_router

app = FastAPI()

# Mount both routers
app.include_router(ifm_router, prefix="/ifm")
# app.include_router(ocr_router, prefix="/ocr")
