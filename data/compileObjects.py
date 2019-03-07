
# coding: utf-8

# # Read in all json files in a directory and create 1 combined file for app
# 

# In[167]:


import pandas as pd
import json
import numpy as np
import os


# ### Read in all the data

# In[168]:


loc = os.path.join('TileWallData','objectFiles')


# In[169]:


files = os.listdir(loc)
#print(files)


# In[170]:


objects = {}
categories = []
for f in files:
    df = pd.read_json(os.path.join(loc,f),typ='dict', encoding = "ISO-8859-1", convert_axes = False)
# had a problem with pandas wanting to automatically convert M60 to a Timestamp!
#     if (f == "M60.json"):
#         print(f)
#         print(df)
    objects.update(df)
    categories.append(df[0]['Category'])


# ### Identify the unique categories, and create the new dataframe

# In[171]:


categories = list(set(categories))
print(categories)
dictOut = {}
for c in categories:
    dictOut[c] = []


# In[172]:


for key, o in objects.items():
    dictOut[o['Category']].append({key:o})
#print(dictOut)


# ### Dump this to json

# In[173]:


with open('allObjects.json', 'w') as fp:
    json.dump(dictOut, fp)


# # Put this into a stand-alone python code as well.
# 
# ```jupyter nbconvert --to script [YOUR_NOTEBOOK].ipynb```

# In[114]:


get_ipython().system('jupyter nbconvert --to script compileObjects.ipynb')

