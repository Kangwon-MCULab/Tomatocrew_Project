import time
import os
import schedulerk
import threading



task = schedulerk.Scheduler()


run = threading.Thread(target=task.run)
run.start()
print("run start")
idle = threading.Thread(target=task.idleRun)
idle.start()
print("idle start")


