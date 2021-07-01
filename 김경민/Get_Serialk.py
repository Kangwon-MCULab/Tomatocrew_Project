from typing import AsyncContextManager
import time
import math
import datetime
import serial
import kalmantime


Radian_To_Degree = 180 / math.pi
ALPHA = 0.04
gyro_sen = 17179869

gyro_sum = 0

dt_giro = 0
prev = 0
now = 0

def initDT() :
    global prev
    prev = time.time()

def calcDT() :
    global now
    global prev
    global dt_giro
    now = time.time()
    dt_giro = (now - prev)
    prev = now

def set_Angle_X(AX, AY, AZ) :
    return math.atan(AY / (math.sqrt(pow(AX, 2) + math.pow(AZ, 2)))) * Radian_To_Degree

def set_Angle_Y(AX, AY, AZ) :
    return math.atan(-1*AX / (math.sqrt(pow(AY, 2) + math.pow(AZ, 2)))) * Radian_To_Degree

def set_Angle_Z(AX, AY, AZ) :
    return math.atan(AZ / math.sqrt(AX*AX + AZ*AZ)) * Radian_To_Degree
    
def set_ACC(d, c, b, a) :
    if d == 255 :
        d = 255 - d
        c = 255 - c
        b = 255 - b
        a = 255 - a
        return -1*(d*pow(255,3) + c*pow(255,2) + b*pow(255,1) + a)
    else :
        return d*pow(255,3) + c*pow(255,2) + b*pow(255,1) + a

def set_Giro(d, c, b, a) :
    if d > 127 :
        d = 255 - d
        c = 255 - c
        b = 255 - b
        a = 255 - a
        return -1*(d*pow(255,3) + c*pow(255,2) + b*pow(255,1) + a)
    else :
        return d*pow(255,3) + c*pow(255,2) + b*pow(255,1) + a


class Get_Serial:
    def __init__(self):
        self.ser = serial.Serial("COM3", 115200, timeout = 1) # Bound Rate = 460800, get Data rate = 0.01s
        self.start_time = 0
        self.Roll = kalmantime.Kalman()
        self.Pitch = kalmantime.Kalman()
        self.Yaw = kalmantime.Kalman()
        self.Giro_Yaw = 0
        

    def SendCommand(self,command):
        print("Connecting deivces. Please wait 10 seconds..")
        time.sleep(7)
        self.ser.write(bytes(command,encoding='ascii')) # START COMMAND
        print("command success!")
        time.sleep(3)
        self.start_time = time.time()
        while 1 :
            Data = self.ser.read(size = 36)
            if len(Data) == 0 :
                initDT()
                print("Empty data")
                continue
            else :
                AX = set_ACC(int(Data[11]), int(Data[10]), int(Data[9]), int(Data[8]))
                AY = set_ACC(int(Data[15]), int(Data[14]), int(Data[13]), int(Data[12]))
                AZ = set_ACC(int(Data[19]), int(Data[18]), int(Data[17]), int(Data[16]))
                calcDT()
                self.Roll.setKalmanAngle(set_Angle_X(AX, AY, AZ))
                self.Pitch.setKalmanAngle(set_Angle_Y(AX, AY, AZ))
                self.Yaw.setKalmanAngle(0)
                print("Setting Success")
                break
        

        
    def get_data(self) :
        global dt_giro
        global gyro_sum
        Data = self.ser.read(size = 36)
        
        if(len(Data)==0) : 
            return [0, 0, 0]

        index = Data[3]
        AX = set_ACC(int(Data[11]), int(Data[10]), int(Data[9]), int(Data[8]))
        AY = set_ACC(int(Data[15]), int(Data[14]), int(Data[13]), int(Data[12]))
        AZ = set_ACC(int(Data[19]), int(Data[18]), int(Data[17]), int(Data[16]))
        GX = (set_Giro(int(Data[23]), int(Data[22]), int(Data[21]), int(Data[20])) - 31744.65) / gyro_sen
        GY = (set_Giro(int(Data[27]), int(Data[26]), int(Data[25]), int(Data[24])) - 292093.53) / gyro_sen
        GZ = int((set_Giro(int(Data[31]), int(Data[30]), int(Data[29]), int(Data[28])) + 225949.8) / gyro_sen)
        dt = time.time() - self.start_time

        calcDT()

        self.Giro_Yaw = self.Giro_Yaw + GZ * dt_giro

        AngleAX = set_Angle_X(AX,AY,AZ)
        AngleAY = set_Angle_Y(AX,AY,AZ)
        

        R = round(self.Roll.getKalmanAngle(AngleAX, GX, dt))
        P = round(self.Pitch.getKalmanAngle(AngleAY, GY, dt))
        Y = round(self.Yaw.getKalmanAngle(self.Giro_Yaw*17, GZ, dt))

        return [R, P, Y]
       

        
    

