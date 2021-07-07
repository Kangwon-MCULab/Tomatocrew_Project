import time
import os
import chan_scheduler
from multiprocessing import Process
import threading
import chan_Realplot


if __name__ == '__main__':

    
    task = chan_scheduler.Scheduler()

    run = threading.Thread(target=task.run)
    run.start()
    print("run start")

    idle = threading.Thread(target=task.idleRun)
    idle.start()
    print("idle start")

    DataPlotting = threading.Thread(target=chan_Realplot.start)
    DataPlotting.start()
    print("ploting start")