@echo off
title Collector Service
cd /d "C:\Users\Gokul\Documents\Anything_Aug-18\anything-llm\collector"
echo Starting AnythingLLM Collector Service...
echo Service will run on http://localhost:8888
echo.
node start-collector-simple.js
