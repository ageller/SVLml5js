
# coding: utf-8

# # Read in all json files in a directory and create 1 combined file for app
# 

# In[28]:


import pandas as pd
import json
import numpy as np
import os


# ### Read in all the data

# In[29]:


loc = os.path.join('TileWallData','objectFiles')


# In[30]:


files = os.listdir(loc)
#print(files)


# In[31]:


objects = []
categories = []
for f in files:
    df = pd.read_json(os.path.join(loc,f),typ='dict')
    objects.append(df)
    categories.append(df['Category'])


# ### Identify the unique categories, and create the new dataframe

# In[32]:


categories = list(set(categories))
print(categories)
dictOut = {}
for c in categories:
    dictOut[c] = []


# In[33]:


for o in objects:
    dictOut[o['Category']].append(dict(o))
#print(dictOut)


# ### Dump this to json

# In[34]:


with open('allObjects.json', 'w') as fp:
    json.dump(dictOut, fp)


# # Put this into a stand-alone python code as well.
# 
# ```jupyter nbconvert --to script [YOUR_NOTEBOOK].ipynb```

# In[35]:


get_ipython().system('jupyter nbconvert --to script compileObjects.ipynb')

