import time
import os
import scheduler
import threading



task = scheduler.Scheduler()


idle = threading.Thread(target=task.idleRun)
idle.start()


run = threading.Thread(target=task.run)
run.start()