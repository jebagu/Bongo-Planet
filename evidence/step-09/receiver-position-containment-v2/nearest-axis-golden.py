"""Pure independent Decimal80 reference; no service/browser/product execution."""
from decimal import Decimal,localcontext
from pathlib import Path
import json
with localcontext() as ctx:
 ctx.prec=80
 phi=(Decimal(1)+Decimal(5).sqrt())/2
 norm=(9*phi*phi+1).sqrt()
 large=3*phi/norm
 small=1/norm
 value={"precisionDigits":80,"derivation":"phi=(1+sqrt(5))/2; normalize(3phi,0,1)","phi":str(phi),"large":str(large),"small":str(small),"positions":{"right":[str(large),"0",str(small)],"left":[str(-large),"0",str(small)],"forward":[str(-small),str(large),"0"],"back":[str(small),str(-large),"0"],"up":["0",str(small),str(large)],"down":["0",str(-small),str(-large)]},"vertices":{"right":85,"left":29,"forward":10,"back":69,"up":37,"down":53}}
 out=Path(__file__).with_name("Golden-Decimal80.json")
 with out.open("x") as f:json.dump(value,f,indent=2)
 print(json.dumps({"status":"pure Decimal80 golden prepared","large":str(large),"small":str(small)}))
