import pandas as pd
import numpy as np
import os
import re
import json
import wikipedia
import wptools #https://github.com/siznax/wptools

class SVLobject(object):

	def __init__(self, *args,**kwargs):

		#User Input Required
		self.name = None
		self.category = None
		self.fileName = None

		#User Input Optional
		self.view = 1.0
		self.captionMaxLen = 1000
		self.captionMinLen = 10

		#Defined within code
		self.RA = None
		self.Dec = None
		self.distance = None
		self.size = None
		self.WWTurl = None
		self.images = None
		self.captions = None
		self.wikipediaUrl = None
		self.summary = None


	def getWWTcmd(self):
		"""
		Define the command to fly WWT
		"""
		self.WWTurl = 'http://tilewall.adlerplanetarium.org:5050/layerApi.aspx?cmd=mode&lookat=Sky&flyto='+str(self.Dec)+','+str(self.RA)+','+str(self.view)+',0,0'

	def splitString(self,st):
		"""
		Split strings from the wikipedia infobox entry, for RA, Dec, and Distance
		"""
		digits = np.array([i for i,c in enumerate(st) if (c.isdigit() or c == '.' or c == '-')])
		prefix = ''
		if (st[digits[0]] == '-'):
			digits = digits[1:]
			prefix = '-'

		diff = np.diff(digits)
		loc = np.where(diff > 1)[0]
		#print(digits, diff, loc)
		svals = []
		i0 = digits[0]
		for lo in loc:
			i1 = digits[lo+1]-(diff[lo]-1)
			svals.append(prefix+st[i0:i1])
			i0 = digits[loc[0]+1]
		if (len(loc)>0):
			svals.append(prefix+st[digits[loc[-1]+1]:digits[-1]+1])  
		else:
			svals.append(prefix+st[digits[0]:digits[-1]+1]) 
		return svals

	def getCaption(self, parsetree,img):
		"""
		Parse through the wikipedia notation for a usable caption
		"""

		p1 = 0
		if ('/' in img):
			p1 = img.rfind('/')+1
		imgSearch = img[p1:].replace('_',' ')
		print("\nSEARCHING FOR : ", img, imgSearch)

		#print("PARSETREE :",parsetree)
		caption = ''
		p1 = parsetree.lower().find(imgSearch.lower())
		if (p1 >= 0):
			caption = parsetree[p1+len(imgSearch):]
			#get the full caption, with all the markup
			left = 2
			right = 0
			for i,c in enumerate(caption):
				if (c == '['):
					left += 1
				if (c == ']'):
					right += 1
				if (left == right):
					break
			caption = caption[0:i-1]
			#print("first pass : ",caption)
			#remove the markup
			#for citations
			Ntrial = 0
			while ('{{' in caption and Ntrial < 100): 
				remove = []
				p1 = caption.find('{{')
				p2 = caption.find('}}')
				remove.extend([i+p1+1 for i in range(p2-p1)])
				cap = ''
				for i, c in enumerate(caption):
					if (i not in remove):
						cap += c
				#print('cap : ', cap, remove)
				caption = cap
				Ntrial += 1
			
			#links to other wikipedia pages
			Ntrial = 0
			while ('[[' in caption and Ntrial < 100): 
				remove = []
				p1 = caption.find('[[')
				p2 = caption.find(']]')
				remove.extend([p1,p1+1, p2,p2+1])
				check = caption[p1:p2]
				#print("checking", check)
				p3 = check.find('|')
				if (p3 > 0):
					remove.extend([i+p1+1 for i in range(p3)])
				cap = ''
				for i, c in enumerate(caption):
					if (i not in remove):
						cap += c
				#print('cap : ', cap, remove)
				caption = cap
				Ntrial += 1
				
			#other html markup
			Ntrial = 0
			done = False
			#print('caption to here : ', caption)
			while (not done and Ntrial < 100):
				remove = []
				p1 = caption.find('<ext>')
				p2 = caption.find('</ext>')
				if (p1 >=0 and p2 >=0):
					remove.extend([i+p1 for i in range(p2-p1+6)])
				else:
					done = True
					break
				cap = ''
				for i, c in enumerate(caption):
					if (i not in remove):
						cap += c
				#print('cap : ', cap, remove)
				caption = cap
				Ntrial += 1
				
			#remove any bits at the beginning
			p1 = 0
			p = caption.rfind('|')
			if (p > 0):
				p1 = p
			caption = caption[p1+1:]
			
			
			if (len(caption) > self.captionMaxLen or len(caption) < self.captionMinLen):
				print("bad caption : ", len(caption))
				caption = None
				
		print("CAPTION : ", caption)
			
			
		return caption


	def getWikiInfo(self):
		"""
		Get all the relevant information from wikipedia
		#https://wikipedia.readthedocs.io/en/latest/quickstart.html
		"""

		site = wikipedia.search(self.name)
		print(self.name)
		if (site):
			print("wiki page: ", site[0])
			page = None
			try:
				page = wikipedia.page(site[0])
			except wikipedia.exceptions.DisambiguationError as e:
				print(e.options)
				#pass
			if (page):
				self.wikipediaUrl = page.url
				self.summary = page.summary

				#get more info with wptools
				#https://github.com/siznax/wptools/wiki/
				wpage = wptools.page(site[0])
				wpage.get_more()
				wpage.get_query()
				wpage.get_parse()
				
				#get all the images (works better with wikipedia instead of wptools, but need wptools for captions)
				#print(page.images)
				#print(wpage.data['parsetree'])
				for i in page.images:
					if (("jpg" in i or "png" in i) and "Celestia" not in i):
						cap = self.getCaption(wpage.data['parsetree'], i)
						if (cap): #only keep images with captions.  I think this will cut down on the images we don't want.
							if (self.images == None):
								self.captions = []
								self.images = []
							self.captions.append(cap)
							self.images.append(i)
						
			
				#get the main image (only possible with wptools)
				mainImg = None
				mainCap = None
				if (wpage.images()):
					for i in wpage.images():
						print('CHECKING', i['kind'])
						if (i['kind'] == 'query-pageimage'):
							mainImg = i['url']
							print('HAVE mainImg : ', mainImg)
							if ('metadata' in i):
								if ('ImageDescription' in i['metadata']):
									mainCap = i['metadata']['ImageDescription']['value']
									
							if (mainCap == None):
								mainCap = getCaption(wpage.data['parsetree'], i['url'])
							print('HAVE mainCap :', mainCap)
								
				if (mainImg):
					img2 = self.images
					caption2 = self.captions
					self.images = [mainImg]
					self.captions = [mainCap]
					for i,c in zip(img2,caption2):
						if (i != mainImg):
							self.images.append(i)
							self.captions.append(c)
				
				#get the infobox for RA, Dec, etc.
				
				info = wpage.data['infobox']
				if ('ra' in info and self.RA == None):
					RAstring = info['ra']
					print('RAstring', RAstring)
					st = self.splitString(RAstring)
					#print('RA', st)
					self.RA = float(st[0])
					if (len(st) > 1): self.RA += float(st[1])/60.
					if (len(st) > 2): self.RA += float(st[2])/3600.
					print('RA', self.RA, st)

				if ('dec' in info and self.Dec == None):
					DecString = info['dec']
					print('DecString', DecString)
					digits = np.array([i for i,c in enumerate(DecString) if (c.isdigit() or c == '.')])
					st = self.splitString(DecString)
					#print('Dec', st)
					self.Dec = float(st[0])
					if (len(st) > 1): self.Dec += float(st[1])/60.
					if (len(st) > 2): self.Dec += float(st[2])/3600.
					print('Dec', self.Dec, st)

				if ('distance' in info and self.distance == None):
					DistString = info['distance']
					print('DistString', DistString)
					st = self.splitString(DistString)
					#print('Distance',st)
					d = st[0]
					p1 = DistString.find(d) + len(d)
					DistString = DistString[(p1+1):]
					p1 = DistString.find('|')
					u = DistString[:p1]
					self.distance = d + ' ' + u
					print('Distance ', self.distance)
					
				if ('size' in info and self.size == None):
					self.size = info['size']
				
				if (self.RA and self.Dec and self.view):
					self.getWWTcmd()
					
	def makeOutput(self):
		"""
		Write to the file
		"""

		dictOut = {}
		dictOut[self.name] = {}
		dictOut[self.name]['WWTurl'] = self.WWTurl
		dictOut[self.name]['Distance'] = self.distance
		dictOut[self.name]['Size'] = self.size
		dictOut[self.name]['Notes'] = self.summary
		dictOut[self.name]['Category'] = self.category
		dictOut[self.name]['images'] = self.images
		dictOut[self.name]['captions'] = self.captions
		dictOut[self.name]['wikipedia'] = self.wikipediaUrl
	
		with open(self.fileName, 'w') as fp:
			json.dump(dictOut, fp)


	def createObject(self):
		"""
		Main method to call everything, after setting the name, category, and fileName
		"""

		self.getWikiInfo()
		print('IMAGES : ', self.images)
		self.makeOutput()
		print('\n')
		print('############')
		print('### Done ###')
		print('############')

