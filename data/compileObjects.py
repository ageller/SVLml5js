
# coding: utf-8

# # Read in all json files in a directory and create 1 combined file for app
# 

# In[1]:


import pandas as pd
import json
import numpy as np
import os


# ### Read in all the data

# In[2]:


def getData(loc):
    files = []
    locDict = {} #a dict to attach the location to each file for later, so that I can sort by filename
    for lo in loc:
        print(lo)
        ff = os.listdir(lo)
        for f in ff:
            locDict[f] = lo
        files.extend(ff)
    files = sorted(files, key=str.lower) #sort by filename (which should be the object name as well)
    objects = {}
    categories = []
    for f in files:
        if (f[0] != '.'):
            print(f)
            df = pd.read_json(os.path.join(locDict[f],f),typ='dict', encoding = "ISO-8859-1", convert_axes = False)
        # had a problem with pandas wanting to automatically convert M60 to a Timestamp!
        #     if (f == "M60.json"):
        #         print(f)
        #         print(df)
            objects.update(df)
            categories.append(df[0]['Category'])
        
    return objects, categories


# *From the TileWall files and user object*

# In[3]:

def compileAll():

    loc1 = os.path.join('TileWallData','objectFiles')
    loc2 = 'userObjects'
    objects, categories = getData([loc1, loc2])


    # ### Identify the unique categories, and create the new dataframe

    # In[12]:


    categories = sorted(list(set(categories)), key=str.lower)
    print(categories)
    dictOut = {}
    for c in categories:
        dictOut[c] = []


    # In[5]:


    for key, o in objects.items():
        dictOut[o['Category']].append({key:o})
    #print(dictOut)


    # ### Dump this to json

    # In[6]:


    with open('allObjects.json', 'w') as fp:
        json.dump(dictOut, fp)


