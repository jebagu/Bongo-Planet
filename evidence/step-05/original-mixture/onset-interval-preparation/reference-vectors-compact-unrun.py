"""Independent exact-rational controls; never imports the TS module or frozen oracle.
Direct high-degree series (no range reduction/scaling) plus rational remainder bounds.
Only final enclosure endpoints are converted to binary64, directed by exact comparison.
"""
from fractions import Fraction as F
from math import factorial,nextafter,inf
from pathlib import Path
import json

def bounds_float(pair):
 lo,hi=pair;l=float(lo);h=float(hi)
 if F.from_float(l)>lo:l=nextafter(l,-inf)
 if F.from_float(h)<hi:h=nextafter(h,inf)
 return [l,h]
def compress(a):
 scale=10**80
 return (F((a[0]*scale).__floor__(),scale),F((a[1]*scale).__ceil__(),scale))
def add(a,b):return(a[0]+b[0],a[1]+b[1])
def sub(a,b):return(a[0]-b[1],a[1]-b[0])
def mul(a,b):
 v=[x*y for x in a for y in b];return(min(v),max(v))
def div(a,b):
 assert not b[0]<=0<=b[1]
 v=[x/y for x in a for y in b];return(min(v),max(v))
def point(x):v=F.from_float(x);return(v,v)
def atan_alternating(x,n):
 s=sum(((-1)**k*x**(2*k+1)/F(2*k+1) for k in range(n)),F(0));next_term=(-1)**n*x**(2*n+1)/F(2*n+1)
 return(min(s,s+next_term),max(s,s+next_term))
# tan(4*atan(1/5)-atan(1/239)) is exactly1, in the first quadrant.
t=F(1,5);tan4=4*t*(1-t*t)/(1-6*t*t+t**4);assert (tan4-F(1,239))/(1+tan4/F(239))==1
pi=compress(mul((F(4),F(4)),sub(mul((F(4),F(4)),atan_alternating(t,60)),atan_alternating(F(1,239),20))))
assert F.from_float(3.141592653589793)<pi[0]<pi[1]<F.from_float(3.1415926535897936)
def sine_point(x):
 if abs(x)<F(1,10**100):return(x-abs(x)**3/6,x+abs(x)**3/6)
 # degree161; degree162 zero coefficient; derivative163 bounded by1.
 s=sum(((-1)**k*x**(2*k+1)/factorial(2*k+1)for k in range(81)),F(0));r=abs(x)**163/factorial(163)
 return compress((s-r,s+r))
def sine(a):
 mid=(a[0]+a[1])/2;rad=(a[1]-a[0])/2;s=sine_point(mid)
 # |sin'|<=1, applied continuously over the rational support.
 return(s[0]-rad,s[1]+rad)
def exponential_point(x):
 assert abs(x)<=4
 s=sum((x**k/factorial(k)for k in range(121)),F(0));r=3125*abs(x)**121/factorial(121)
 # exp(|x|)<=exp(4)<3125 from exp(4/5)<1/(1-4/5)=5.
 return compress((s-r,s+r))
def exponential(a):return(exponential_point(a[0])[0],exponential_point(a[1])[1])
def tanh(a):
 e=exponential(mul((F(2),F(2)),a));return div(sub(e,(F(1),F(1))),add(e,(F(1),F(1))))
def voice(v,time):
 age=sub(point(time),point(v['onset']));duration=point(v['duration']);level=point(v['level']);assert age[0]>0 and age[1]<duration[0]
 attack=min(F(1),age[0]/F.from_float(.002));release=min(F(1),(duration[0]-age[0])/min(F.from_float(.02),duration[0]/4));envelope=(attack*release,)*2
 if v['kind']=='sine':phase=mul(mul((F(2),)*2,pi),mul(point(v['frequency']),age));gain=point(.18)
 else:
  cycles=add(mul(point(48.),age),mul(point(2.31),sub((F(1),)*2,exponential(mul(point(-1.),div(age,point(.022)))))))
  phase=mul(mul((F(2),)*2,pi),cycles);gain=mul(point(.65),exponential(mul(point(-4.5),div(age,duration))))
 return mul(mul(mul(sine(phase),gain),envelope),level)
vectors=[]
for kind,fn,values in [('sine',sine,[.123456789,1.23456789,3.125,7.125,1e-300]),('exp',exponential,[-3.125,-.123456789,.123456789,3.125]),('tanh',tanh,[-1.23456789,.123456789,1.23456789])]:
 for x in values:vectors.append({'function':kind,'input':x,'expected':bounds_float(fn(point(x)))})
for kind in ['sine','kick']:
 v={'kind':kind,'onset':.0187655,'frequency':440.,'duration':.6,'level':.65};time=.02
 vectors.append({'function':'voice','voice':v,'time':time,'expected':bounds_float(voice(v,time))})
output=Path(__file__).with_name('reference-vectors.json')
if output.exists():raise RuntimeError('Refusing existing independently derived vectors')
output.write_text(json.dumps({'method':'Exact Fraction arithmetic; direct degree161 sine/degree120 exp rational remainder, Machin pi bounds, continuous sine Lipschitz bound; directed Float64 endpoints. No JS Math, module, PCM or synth imports.','piExpected':bounds_float(pi),'vectors':vectors},indent=2)+'\n')
print(str(output))
