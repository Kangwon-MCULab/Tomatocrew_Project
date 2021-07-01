import time
import os
import scheduler
from multiprocessing import Process
import threading
import Realplot




if __name__ == '__main__':

    
    task = scheduler.Scheduler()

    run = threading.Thread(target=task.run)
    run.start()
    print("run start")

    idle = threading.Thread(target=task.idleRun)
    idle.start()
    print("idle start")

    DataPlotting = threading.Thread(target=Realplot.start)
    DataPlotting.start()
    print("ploting start")





