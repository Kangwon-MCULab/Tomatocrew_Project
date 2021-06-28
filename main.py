import time
import os
import scheduler
import threading



task = scheduler.Scheduler()


run = threading.Thread(target=task.run)
run.start()
print("run start")
idle = threading.Thread(target=task.idleRun)
idle.start()
print("idle start")


