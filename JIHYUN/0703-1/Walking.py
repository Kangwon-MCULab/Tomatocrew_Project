class walkingdetect:




    def walkingdetect(self,data,f,count,time):
        if data == [0,0,0]:
        pass

        else :

            global f
            global data_1
            global data_2
            global data_3
            global data_4
            global m
            global t
            global t_4
            global t_3
            m=[]
            end = time.time()
            start=round((end-counttime),1)
            now=datetime.datetime.now()
            print(start)
        

            data_1 = 0
            data_2 = 0
            data_3 = 0
            data_4 = 0
             #기울기
            m=[0,0,0]
         
            t = 1.2
            t_4 = 0.3
            t_3 = t*(3/4)

            if((start %0.2)==0 ):
                data_1 = data[1]
                

            if((start %t_4 )== 0):
                data_2 = data[1]
                m[0] = (data_2 - data_1)/t_4
            
            #print(data_1,m[0])

        #  if((start % t_3) == 0):
        #     data_3 = data[1]
        #     m2 = (data_3 - data_2)/(t_3 - t_4)

        #  if((start%t)==0):
        #  data_4 = data[1]
        #   m3 = (data_4 - data_3)/(t - t_3)
        #   start = time.time()
                
            
        # if(m1>0):
        #     count = count + 1 

