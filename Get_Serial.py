from typing import AsyncContextManager
import time
import math
import serial



def get_pitch(x, y, z): #y-rotation
	radians = math.atan2(x, math.sqrt(y*y + z*z))
	return math.degrees(radians)

def get_roll(x, y, z): #x-rotation
	radians = -math.atan2(y, z)
	return math.degrees(radians)

def get_yaw(x,y,z):
    radians = math.atan(z / math.sqrt(x*x + z*z))
    return math.degrees(radians)

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
        self.ser = serial.Serial("COM7", 115200, timeout = 0.1) # Bound Rate = 460800, get Data rate = 0.01s

    def SendCommand(self,command):
        print("Connecting deivces. Please wait 10 seconds..")
        time.sleep(10)
        self.ser.write(bytes(command,encoding='ascii')) # START COMMAND
        
    def get_data(self) :
        Data = self.ser.read(size = 36)
        if(len(Data)==0) : 
            return [0, 0, 0]

        index = Data[3]
        AX = set_ACC(int(Data[11]), int(Data[10]), int(Data[9]), int(Data[8]))
        AY = set_ACC(int(Data[15]), int(Data[14]), int(Data[13]), int(Data[12]))
        AZ = set_ACC(int(Data[19]), int(Data[18]), int(Data[17]), int(Data[16]))
        GX = set_Giro(int(Data[23]), int(Data[22]), int(Data[21]), int(Data[20]))
        GY = set_Giro(int(Data[27]), int(Data[26]), int(Data[25]), int(Data[24]))
        GZ = set_Giro(int(Data[31]), int(Data[30]), int(Data[29]), int(Data[28]))


        try :  
            pitch = math.atan( AX / (math.sqrt(pow(AY,2) + pow(AZ,2))) )*180/math.pi
        except :
            if AX > 0 :
                pitch = 90
            else :
                pitch = -90

        try :  
            roll = math.atan( AY / (math.sqrt(pow(AX,2) + pow(AZ,2))) )*180/math.pi
        except :
            if AY > 0 :
                roll = 90
            else :
                roll = -90

        try :  
            yaw = math.atan (AZ/math.sqrt(AX*AX + AZ*AZ)                     )*180 /math.pi
            #yaw = math.atan( (math.sqrt( pow(AX,2) + pow(AY,2)) ) / AZ )*180/math.pi
        except :
            yaw = 90     
        

        return [ roll, pitch, yaw]

    

