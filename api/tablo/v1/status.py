import json, os

def handler(request):
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Cache-Control": "no-store"},
        "body": json.dumps({
            "elevat.system": {"text": os.getenv("ELEVAT_SYSTEM","READY"), "number": 1, "delta": 0, "ttl": 120},
            "elevat.hermes": {"text": os.getenv("ELEVAT_HERMES","ONLINE"), "number": 1, "delta": 0, "ttl": 120},
            "elevat.revenue": {"text": os.getenv("ELEVAT_REVENUE","ACTIVE"), "number": 1, "delta": 0, "ttl": 300},
            "elevat.paper": {"text": os.getenv("ELEVAT_PAPER","PAPER"), "number": 0, "delta": 0, "ttl": 120},
            "elevat.alerts": {"text": os.getenv("ELEVAT_ALERTS","0"), "number": 0, "delta": 0, "ttl": 120},
            "elevat.deploy": {"text": os.getenv("ELEVAT_DEPLOY","READY"), "number": 1, "delta": 0, "ttl": 300}
        })
    }
