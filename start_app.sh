nohup gunicorn --bind 0.0.0.0:5000 app.app:app \
--workers 4 \
--timeout 120 \
--max-requests 1000 \
--max-requests-jitter 100 \
--access-logfile - \
--error-logfile - > gunicorn.log 2>&1 &
