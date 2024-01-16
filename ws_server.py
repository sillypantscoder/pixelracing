import asyncio
from websockets.server import serve, WebSocketServerProtocol
from websockets.exceptions import ConnectionClosedOK
from websockets.typing import Origin
import typing
import time

hostName = "0.0.0.0"
serverPort = 8774

connections: "list[Connection]" = []
class Connection:
	def __init__(self, sender: typing.Callable[[ str ], None], ender: typing.Callable[[ ], None]):
		self.send = sender
		self.end = ender
		connections.append(self)
	def recieve(self, message: str):
		for c in connections:
			if c == self: continue
			c.send(message)
	def onclose(self):
		connections.remove(self)

async def handle_connection(websocket: WebSocketServerProtocol):
	print("Accepted connection")
	def send(message: str):
		async def run():
			try:
				await websocket.send(message)
			except ConnectionClosedOK: pass
		asyncio.create_task(run())
	def end():
		async def run():
			await websocket.close()
		asyncio.create_task(run())
	c = Connection(send, end)
	async for message in websocket:
		if isinstance(message, str):
			c.recieve(message)
	c.end()
	print("Ended connection")

async def main():
	async with serve(handle_connection, hostName, serverPort, origins=[Origin("https://games.sillypantscoder.com"), None, Origin("*")]) as server:
		print(f"Server started ws://{hostName}:{serverPort}")
		try:
			while True:
				time.sleep(1)
		except KeyboardInterrupt:
			print("Server stopped")
			# server.ws_server.close()

asyncio.run(main())