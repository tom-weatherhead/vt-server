# vt-server
Virginia Tech project - MongoDB / REST Web service

To run this project inside a Docker container:

- Install Docker as follows (these instructions are for Ubuntu 18.04 Desktop) :

Run the commands beginning with "#" as root.
Run the commands beginning with "$" as a normal user.

# apt update
# apt install apt-transport-https ca-certificates curl software-properties-common
# curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
# add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
# apt update
# apt-cache policy docker-ce
# apt install docker-ce
# systemctl status docker
# usermod -aG docker <username>
	- This adds the user to the group docker; it allows the user to run docker without sudo
- Now log out, then log in again, so that the usermod will take effect.
$ docker run hello-world

- Then install the dependencies for vt-server:

$ npm i

- Then change the following line in config/config.json from:

	"databaseUrl": "mongodb://localhost:27017",

... to:

	"databaseUrl": "mongodb://database:27017",

- Then build and launch the Docker containers:

$ docker-compose up --build

- Then populate the MongoDB database in one of the Docker containers:

$ curl -X POST http://localhost:3000/u/ingest

- Then read the ingested data back:

$ curl http://localhost:3000/u/
