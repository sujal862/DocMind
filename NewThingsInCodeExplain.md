# app/api/routes/documents.py

# BackgroundTask in FastApi :
 User request → turant response do → background mein kaam karo
                     ↑                        ↑
               "Upload ho raha hai"      actual processing
               (instant)                 (baad mein)

# Comparison : 
 Redis/Valkey + Celery    →    FastAPI BackgroundTasks
       ↓                              ↓
 Persistent queue                In-memory queue
 Worker alag process             Same process mein
 Retry if failed                 No retry
 Server restart → safe           Server restart → tasks gone ❌
 100s of tasks handle            Simple tasks only
 Production grade                Dev/simple use only


# | = Pipe operator — ek ke output ko doosre ka input banana
